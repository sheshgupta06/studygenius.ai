import requests
url='http://127.0.0.1:8001/api/v1/auth/register'
try:
    r=requests.post(url,json={'email':'hostcheck@example.com','password':'password123','full_name':'Host Check'})
    print('status', r.status_code)
    print(r.text)
except Exception as e:
    print('error', e)
