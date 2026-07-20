import os
import json
from urllib import request, error
from app.config.settings import get_settings

s = get_settings()
print('ALLOWED_ORIGINS:', s.ALLOWED_ORIGINS)
print('.env exists:', os.path.exists('.env'))

url = 'http://localhost:8000/api/v1/auth/login'
req = request.Request(url, method='OPTIONS', headers={
    'Origin': 'http://127.0.0.1:5175',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
})
try:
    with request.urlopen(req, timeout=5) as resp:
        print('OPTIONS status', resp.status)
        print('headers')
        for k, v in resp.getheaders():
            if k.lower().startswith('access-control'):
                print(k, v)
except error.HTTPError as e:
    print('HTTPError', e.code)
    print(e.headers)
    print(e.read().decode())
except Exception as e:
    print('Exception', e)
