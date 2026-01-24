# Automated API endpoint tests for backend
import requests

BASE_URL = 'http://localhost:5000/api'
import requests

BASE_URL = 'http://localhost:5000/api'

def test_comments():
    # Create a report first
    report = requests.post(f'{BASE_URL}/reports', data={
        'location': 'Test Location',
        'description': 'Test Description',
        'severity': 'low',
        'latitude': 0.3476,
        'longitude': 32.5825
    }).json()
    report_id = report.get('id')
    assert report_id, 'Report creation failed'

    # Add a comment
    comment_res = requests.post(f'{BASE_URL}/reports/{report_id}/comments', json={'text': 'Test comment'})
    assert comment_res.status_code == 200, 'Comment creation failed'

    # Fetch comments
    comments = requests.get(f'{BASE_URL}/reports/{report_id}/comments').json()
    assert any(c['text'] == 'Test comment' for c in comments), 'Comment not found'

    # Edge case: Add empty comment
    empty_res = requests.post(f'{BASE_URL}/reports/{report_id}/comments', json={'text': ''})
    assert empty_res.status_code != 200, 'Empty comment should not be accepted'

    # Cleanup: delete report if endpoint exists
    # requests.delete(f'{BASE_URL}/reports/{report_id}')

if __name__ == '__main__':
    test_comments()

def test_get_reports():
    r = requests.get(f'{BASE_URL}/reports')
    print('GET /reports:', r.status_code, r.json())

def test_post_report():
    payload = {
        'location': 'Automated Location',
        'description': 'Automated Description',
        'severity': 'high',
        'latitude': 0.36,
        'longitude': 32.61
    }
    r = requests.post(f'{BASE_URL}/reports', json=payload)
    print('POST /reports:', r.status_code, r.json())
    return r.json().get('id')

def test_route_suggestions():
    payload = {
        'start': {'latitude': 0.3476, 'longitude': 32.5825},
        'end': {'latitude': 0.3500, 'longitude': 32.6000}
    }
    r = requests.post(f'{BASE_URL}/route-suggestions', json=payload)
    print('POST /route-suggestions:', r.status_code, r.json())

def test_upvote(report_id):
    r = requests.post(f'{BASE_URL}/reports/{report_id}/upvote')
    print(f'POST /reports/{report_id}/upvote:', r.status_code, r.json())

def test_downvote(report_id):
    r = requests.post(f'{BASE_URL}/reports/{report_id}/downvote')
    print(f'POST /reports/{report_id}/downvote:', r.status_code, r.json())

def main():
    test_get_reports()
    new_id = test_post_report()
    test_get_reports()
    test_route_suggestions()
    if new_id:
        test_upvote(new_id)
        test_downvote(new_id)
    # Edge case: invalid report
    print('Testing invalid report submission...')
    bad_payload = {'location': '', 'description': '', 'severity': 'extreme', 'latitude': 999, 'longitude': 999}
    r = requests.post(f'{BASE_URL}/reports', json=bad_payload)
    print('POST /reports (invalid):', r.status_code, r.text)
    # Edge case: invalid route
    print('Testing invalid route suggestion...')
    bad_route = {'start': {'latitude': 'bad', 'longitude': 'bad'}, 'end': {}}
    r = requests.post(f'{BASE_URL}/route-suggestions', json=bad_route)
    print('POST /route-suggestions (invalid):', r.status_code, r.text)

if __name__ == '__main__':
    main()
