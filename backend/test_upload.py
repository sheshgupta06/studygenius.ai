import urllib.request
import json
import urllib.error

login_data = json.dumps({'email': 'test33@example.com', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8001/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())['access_token']
headers = {'Authorization': f'Bearer {token}'}

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    '--' + boundary + '\r\n'
    'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n'
    'Content-Type: application/pdf\r\n\r\n'
    '%PDF-1.4 dummy\r\n'
    '--' + boundary + '--\r\n'
).encode('utf-8')

upload_headers = headers.copy()
upload_headers['Content-Type'] = f'multipart/form-data; boundary={boundary}'
upload_headers['Content-Length'] = str(len(body))

req = urllib.request.Request('http://127.0.0.1:8001/api/v1/documents/upload', data=body, headers=upload_headers, method='POST')
try:
    resp = urllib.request.urlopen(req)
    print('Upload OK:', resp.status, resp.read())
except urllib.error.HTTPError as e:
    print('Upload Failed:', e.code, e.read())
