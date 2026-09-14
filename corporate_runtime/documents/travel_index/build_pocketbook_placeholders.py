from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

base = Path('C:/Users/young/agents/vagary_index/batch_output')
out = base / '_pocketbook_pdf' / 'countries'
out.mkdir(parents=True, exist_ok=True)
countries = ['BGD', 'BTN', 'IND', 'LKA', 'NPL']
for code in countries:
    path = out / f'{code}.pdf'
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(f'Vagary Index — {code} Pocketbook')
    c.setFont('Helvetica-Bold', 16)
    c.drawString(72, 760, f'Vagary Index — {code}')
    c.setFont('Helvetica', 12)
    c.drawString(72, 730, 'Pocketbook content placeholder.')
    c.drawString(72, 710, 'This PDF will be replaced by finalized pocketbook content.')
    c.save()
    print('created', path, 'size', path.stat().st_size)
