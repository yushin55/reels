from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app)  # 프론트엔드에서 접근 가능하도록 CORS 설정

@app.route('/')
def home():
    return jsonify({
        'message': '백엔드 서버가 정상적으로 실행 중입니다!',
        'status': 'running'
    })

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
