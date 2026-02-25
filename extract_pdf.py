import sys
from PyPDF2 import PdfReader

pdf_path = r'c:\DevTools\C0de stuff\managerm\insurance-easy-get\final word project on claim system (1).pdf'
try:
    reader = PdfReader(pdf_path)
    output = []
    output.append(f"Total pages: {len(reader.pages)}")
    output.append("=" * 80)
    
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
            if text and text.strip():
                output.append(f"\n--- PAGE {i+1} ---")
                output.append(text)
        except Exception as e:
            output.append(f"\n--- PAGE {i+1} (ERROR: {e}) ---")
    
    output.append("\n=== END OF DOCUMENT ===")
    
    with open(r'c:\DevTools\C0de stuff\managerm\insurance-easy-get\extracted_pdf.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
    
    print("Done. Written to extracted_pdf.txt")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
