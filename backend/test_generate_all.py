import urllib.request
import json
import time

try:
    from fpdf import FPDF
except ImportError:
    import subprocess
    subprocess.check_call(['.\\.venv\\Scripts\\pip.exe', 'install', 'fpdf2'])
    from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font('Helvetica', size=12)
pdf.cell(200, 10, txt='Machine Learning is the study of computer algorithms that improve automatically through experience and by the use of data.', ln=1)
pdf.output('test_real.pdf')

base_url = 'http://127.0.0.1:8001/api/v1'

def main():
    print('Logging in...')
    login_data = json.dumps({'email': 'test33@example.com', 'password': 'password123'}).encode('utf-8')
    req = urllib.request.Request(f'{base_url}/auth/login', data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
    resp = urllib.request.urlopen(req)
    token = json.loads(resp.read())['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    print('Uploading PDF...')
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    with open('test_real.pdf', 'rb') as f:
        pdf_content = f.read()
    
    body = (
        b'--' + boundary.encode('utf-8') + b'\r\n'
        b'Content-Disposition: form-data; name="file"; filename="test_real.pdf"\r\n'
        b'Content-Type: application/pdf\r\n\r\n'
        + pdf_content + b'\r\n'
        b'--' + boundary.encode('utf-8') + b'--\r\n'
    )
    
    upload_headers = headers.copy()
    upload_headers['Content-Type'] = f'multipart/form-data; boundary={boundary}'
    upload_headers['Content-Length'] = str(len(body))
    
    req = urllib.request.Request(f'{base_url}/documents/upload', data=body, headers=upload_headers, method='POST')
    resp = urllib.request.urlopen(req)
    doc_id = json.loads(resp.read())['id']
    print(f'Upload Success! Doc ID: {doc_id}')

    print('Waiting for ingestion to complete...')
    for _ in range(20):
        time.sleep(2)
        req = urllib.request.Request(f'{base_url}/documents/{doc_id}', headers=headers, method='GET')
        resp = urllib.request.urlopen(req)
        status = json.loads(resp.read())['status']
        print(f'Status: {status}')
        if status == 'ready':
            break
        elif status == 'failed':
            print('Ingestion Failed!')
            return

    types = ['summary', 'notes', 'quiz', 'flashcards']
    for t in types:
        print(f'Generating {t}...')
        payload = json.dumps({'document_id': doc_id, 'generation_type': t}).encode('utf-8')
        req = urllib.request.Request(f'{base_url}/generate', data=payload, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
        try:
            resp = urllib.request.urlopen(req)
            print(f'{t.capitalize()} Gen OK:', resp.status)
        except Exception as e:
            print(f'{t.capitalize()} Gen Failed:', getattr(e, 'read', lambda: str(e))())
            break
            
    print("Testing Chat...")
    payload = json.dumps({'document_id': doc_id, 'message': 'What is this document about?'}).encode('utf-8')
    req = urllib.request.Request(f'{base_url}/chat/stream', data=payload, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
    try:
        resp = urllib.request.urlopen(req)
        print("Chat response bytes:", len(resp.read()))
    except Exception as e:
         print("Chat Failed:", getattr(e, 'read', lambda: str(e))())

if __name__ == '__main__':
    main()
