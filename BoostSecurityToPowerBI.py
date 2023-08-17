import pandas as pd
import json
import requests

def get_findings_with_offset(offset):
    url = "https://api.boostsecurity.io/findings-view/graphql"

    graphql_query = {
        "query": """
        query (
            $first: Int,
            $after: String,
            $locateFindingId: String
        ) {
            findings(
                first: $first,
                after: $after,
                locateFindingId: $locateFindingId
            ) {
                totalCount
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        timestamp
                        findingId
                        isViolation
                        analysisContext {
                            projectName
                        }
                    }
                    cursor
                }
            }
        }
        """,
        "variables": {
            "first": 100,  # Adjust the batch size as needed
            "after": offset,
            # ... other variables
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": "ApiKey " + "<YOUR API KEY>"
    }

    response = requests.post(url, json=graphql_query, headers=headers)
    response_json = response.json()
    return response_json

# Fetch all data with pagination
offset = None
all_data = []

while True:
    json_data = get_findings_with_offset(offset)
    edges = json_data['data']['findings']['edges']
    
    if not edges:
        break
    
    all_data.extend(edges)
    end_cursor = json_data['data']['findings']['pageInfo']['endCursor']
    
    if end_cursor == offset:
        break
    
    offset = end_cursor

# Extract relevant data and create DataFrame
flattened_data = []
for edge in all_data:
    node = edge['node']
    flattened_data.append({
        'timestamp': node['timestamp'],
        'findingId': node['findingId'],
        'isViolation': node['isViolation'],
        'projectName': node['analysisContext']['projectName'],
        'cursor': edge['cursor']
    })

df = pd.DataFrame(flattened_data)
