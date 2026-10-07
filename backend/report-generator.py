import io
import json
import os
import sys
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor('#000079')
ORANGE = colors.HexColor('#F75000')
INK = colors.HexColor('#111827')
MUTED = colors.HexColor('#667085')
BORDER = colors.HexColor('#E4E7EC')
SOFT = colors.HexColor('#F8FAFC')
ORANGE_SOFT = colors.HexColor('#FFF7F1')


def register_font():
    candidates = [
        os.environ.get('REPORT_FONT_PATH', ''),
        '/Users/jo/Library/Fonts/NotoSansTC-VariableFont_wght.ttf',
        '/Users/jo/Library/Fonts/Microsoft-JhengHei.ttf',
        '/Users/jo/Library/Fonts/chinese.simhei.ttf',
        '/Users/jo/Library/Fonts/NotoSansCJKtc-Regular.otf',
        '/System/Library/Fonts/PingFang.ttc',
    ]
    for path in candidates:
        if path and os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont('ReportCJK', path))
                return 'ReportCJK'
            except Exception:
                continue
    return 'Helvetica'


def p(text, style):
    safe = str(text or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return Paragraph(safe.replace('\n', '<br/>'), style)


def generate(report):
    font = register_font()
    styles = {
        'title': ParagraphStyle('title', fontName=font, fontSize=23, leading=30, textColor=NAVY, spaceAfter=5),
        'subtitle': ParagraphStyle('subtitle', fontName=font, fontSize=10, leading=15, textColor=MUTED),
        'section': ParagraphStyle('section', fontName=font, fontSize=14, leading=19, textColor=NAVY, spaceBefore=12, spaceAfter=7),
        'body': ParagraphStyle('body', fontName=font, fontSize=9, leading=14, textColor=INK),
        'small': ParagraphStyle('small', fontName=font, fontSize=8, leading=12, textColor=MUTED),
        'small_right': ParagraphStyle('small_right', fontName=font, fontSize=8, leading=12, textColor=MUTED, alignment=TA_RIGHT),
        'kpi': ParagraphStyle('kpi', fontName=font, fontSize=18, leading=22, textColor=NAVY),
        'score': ParagraphStyle('score', fontName=font, fontSize=13, leading=17, textColor=ORANGE, alignment=TA_RIGHT),
    }
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm, topMargin=16 * mm, bottomMargin=16 * mm)
    basic = report.get('basicInfo') or {}
    groups = report.get('diagnosisGroups') or []
    answers = report.get('diagnosis') or {}
    story = []

    story.append(p('企業財務轉型輔導需求表', styles['small']))
    story.append(p('AI 財務轉型需求診斷報告', styles['title']))
    story.append(p('依據本次問卷填寫結果整理，供後續輔導與報表產出使用。', styles['subtitle']))
    story.append(Spacer(1, 7 * mm))

    calculator = report.get('calculator') or {}
    calculation = report.get('calculation') or {}
    if calculator:
        story.append(p('AI 財務工具情境試算', styles['section']))
        calc_rows = [
            [p('輸入變數', styles['small']), p('設定值', styles['small']), p('估算結果', styles['small'])],
            [p('財會人員／平均月薪', styles['body']), p(f"{calculator.get('people', 0)} 人／NT$ {int(calculator.get('salary', 0)):,}", styles['body']), p(f"年化工時價值 NT$ {int(calculation.get('saving', 0)):,}", styles['body'])],
            [p('每月人工工時／效率提升', styles['body']), p(f"{calculator.get('hours', 0)} 小時／{calculator.get('efficiency', 0)}%", styles['body']), p(f"釋放工時 {int(calculation.get('savedHours', 0)):,} 小時", styles['body'])],
            [p('年度 AI 成本', styles['body']), p(f"NT$ {int(calculator.get('cost', 0)):,}", styles['body']), p(f"ROI {float(calculation.get('roi', 0)):.1f}%／回收期 {float(calculation.get('payback', 0)):.1f} 個月", styles['body'])],
        ]
        calc_table = Table(calc_rows, colWidths=[55 * mm, 58 * mm, 74 * mm], repeatRows=1)
        calc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, ORANGE_SOFT]), ('BOX', (0, 0), (-1, -1), 0.6, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
            ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        story.append(calc_table)
        story.append(p('計算基礎：R = (S × 12) ÷ 2,080；H_saved = N × H × (E ÷ 100) × 12；V_saving = H_saved × R。工時價值不等於現金節省。', styles['small']))

    info_rows = [
        [p('公司名稱', styles['small']), p(basic.get('companyName') or '未填寫', styles['body']), p('統一編號', styles['small']), p(basic.get('taxId') or '未填寫', styles['body'])],
        [p('產業分類', styles['small']), p(report.get('industry') or '未填寫', styles['body']), p('聯絡人', styles['small']), p(basic.get('contactName') or '未填寫', styles['body'])],
        [p('完成時間', styles['small']), p(report.get('completedAt') or '未記錄', styles['body']), p('問卷編號', styles['small']), p(report.get('id') or '未建立', styles['body'])],
    ]
    info = Table(info_rows, colWidths=[25 * mm, 67 * mm, 25 * mm, 67 * mm])
    info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SOFT), ('BOX', (0, 0), (-1, -1), 0.6, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(info)
    story.append(p('診斷摘要', styles['section']))

    summary_rows = [[p('分類', styles['small']), p('平均分數', styles['small_right']), p('完成題數', styles['small_right'])]]
    for group in groups:
        questions = group.get('questions') or []
        values = [answers.get(q.get('id')) for q in questions if answers.get(q.get('id'))]
        average = f'{sum(values) / len(values):.1f} / 5' if values else '未完成'
        summary_rows.append([p(group.get('title'), styles['body']), p(average, styles['score']), p(f'{len(values)} / {len(questions)}', styles['small_right'])])
    summary = Table(summary_rows, colWidths=[126 * mm, 34 * mm, 24 * mm])
    summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SOFT]), ('BOX', (0, 0), (-1, -1), 0.6, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(summary)
    ranked = []
    for group in groups:
        questions = group.get('questions') or []
        values = [answers.get(q.get('id')) for q in questions if answers.get(q.get('id'))]
        if values:
            ranked.append((sum(values) / len(values), group.get('title', '未命名分類')))
    ranked.sort(reverse=True)
    if ranked:
        story.append(p('優先改善排序', styles['section']))
        story.append(p('分數越高代表越需要優先推動，以下依各部分平均分數由高至低排列。', styles['small']))
        ranking_rows = [[p('優先順序', styles['small']), p('建議優先改善領域', styles['small']), p('平均分數', styles['small_right'])]]
        for index, (average, title) in enumerate(ranked, 1):
            ranking_rows.append([p(f'第 {index} 優先', styles['body']), p(title, styles['body']), p(f'{average:.1f} / 5', styles['score'])])
        ranking = Table(ranking_rows, colWidths=[32 * mm, 94 * mm, 34 * mm], repeatRows=1)
        ranking.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [ORANGE_SOFT, colors.white]), ('BOX', (0, 0), (-1, -1), 0.6, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        story.append(ranking)
    story.append(p('詳細填答結果', styles['section']))

    for group in groups:
        story.append(p(group.get('title'), styles['section']))
        rows = [[p('題目', styles['small']), p('分數', styles['small_right']), p('選擇內容', styles['small'])]]
        for question in group.get('questions') or []:
            value = answers.get(question.get('id'))
            options = question.get('options') or []
            selected = options[int(value) - 1] if value and int(value) <= len(options) else '尚未填答'
            rows.append([p(f"{question.get('number', '')}. {question.get('text')}", styles['body']), p(value or '-', styles['score']), p(selected, styles['body'])])
        table = Table(rows, colWidths=[91 * mm, 18 * mm, 75 * mm], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, ORANGE_SOFT]), ('BOX', (0, 0), (-1, -1), 0.6, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
            ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        story.append(table)
        story.append(Spacer(1, 3 * mm))

    story.append(Spacer(1, 4 * mm))
    story.append(p('本報告依填寫資料自動整理，僅供企業內部評估與後續輔導參考。', styles['small']))
    doc.build(story)
    return buffer.getvalue()


if __name__ == '__main__':
    payload = json.load(sys.stdin)
    sys.stdout.buffer.write(generate(payload))
