import argparse
import json
import os
from string import Template

from dateutil import parser
import requests


GITHUB_TOKEN = os.environ['MATHESAR_ORG_GITHUB_TOKEN']

GITHUB_ORG = 'centerofci'
MATHESAR_PROJECT_NUMBER = 1


def run_graphql(graphql):
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'GraphQL-Features': 'projects_next_graphql'
    }
    request = requests.post(
        'https://api.github.com/graphql',
        json={'query': graphql},
        headers=headers
    )
    if request.status_code == 200:
        result = request.json()
        print(f'\tResult of query:\n\t\t{result}')
        return result
    else:
        raise Exception(f'\tQuery failed to run by returning code of {request.status_code}.\n\t\t{graphql}')


def get_project_data():
    print(f'Getting project data for project #{MATHESAR_PROJECT_NUMBER}...')
    query_template = Template(
        """
        {
          organization(login: "$github_org") {
            projectV2(number: $project_num) {
              id
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                  }
                  ... on ProjectV2IterationField {
                    id
                    name
                    configuration {
                      iterations {
                        startDate
                        id
                      }
                    }
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
        """
    )
    query = query_template.substitute(github_org=GITHUB_ORG, project_num=MATHESAR_PROJECT_NUMBER)
    result = run_graphql(query)
    return result['data']['organization']['projectV2']


def add_item_to_project(content_id, project_data):
    print(f'Adding item #{content_id} to project...')
    query_template = Template(
        """
          mutation {
            addProjectV2ItemById(input: {projectId: "$project_id" contentId: "$content_id"}) {
              item {
                id
              }
            }
          }
        """
    )
    query = query_template.substitute(
        project_id=project_data['id'],
        content_id=content_id
    )
    result = run_graphql(query)
    try:
        return result['data']['addProjectV2ItemById']['item']['id']
    except KeyError as e:
        print(f'\tAdd item error:\n\t\t{result}')
        raise e


def get_field_data(field_name, project_data):
    fields = project_data['fields']['nodes']
    field_data = [field for field in fields if field['name'] == field_name][0]
    return field_data


def get_option_data(option_name, field_data):
    settings = json.loads(field_data['options'])
    option_data = [option for option in options if option['name'] == option_name][0]
    return option_data


def update_field_for_item(item_id, field, value, project_data):
    print(f'Updating {item_id} with field ID: {field}, field value: {value}...')
    query_template = Template(
        """
          mutation {
            updateProjectV2ItemField(
              input: {
                projectId: "$project_id"
                itemId: "$item_id"
                fieldId: "$field_id"
                value: "$value"
              }
            ) {
              projectV2Item {
                id
              }
            }
          }
        """
    )
    field_data = get_field_data(field, project_data)
    if field == 'Timestamp':
        value_to_save = value
    else:
        option_data = get_option_data(value, field_data)
        value_to_save = option_data['id']
    query = query_template.substitute(
        project_id=project_data['id'],
        item_id=item_id,
        field_id=field_data['id'],
        value=value_to_save
    )
    result = run_graphql(query)
    return result


def get_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("content_id", help="The issue/PR number to add/update")
    parser.add_argument("--status", help="Status to set ")
    parser.add_argument("--priority", help="Priority to set ")
    parser.add_argument("--work", help="Work to set ")
    parser.add_argument("--timestamp", help="Timestamp to set ")
    return parser.parse_args()


if __name__ == '__main__':
    args = get_arguments()
    content_id = args.content_id
    project_data = get_project_data()
    item_id = add_item_to_project(content_id, project_data)
    if args.status:
        update_field_for_item(item_id, 'Status', args.status, project_data)
    if args.priority:
        update_field_for_item(item_id, 'Priority', args.priority, project_data)
    if args.work:
        update_field_for_item(item_id, 'Work', args.work, project_data)
    if args.timestamp:
        timestamp = parser.parse(args.timestamp)
        timestamp_str = timestamp.strftime('%Y-%m-%d %H:%M:%S')
        update_field_for_item(item_id, 'Timestamp', timestamp_str, project_data)
