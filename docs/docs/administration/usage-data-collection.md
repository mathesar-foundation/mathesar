# Usage Data Collection

You can opt-in to allow Mathesar to gather anonymized usage data. This is very valuable to us to help us improve Mathesar’s features, performance, and stability, through understanding how Mathesar is being used, enabling us to identify areas to improve the user experience, and allowing us to track adoption and ensure the reliability of the tool.

## Data Sent

When you've opted-in to usage data collection, the following information is sent every 24 hours:

- **created_at**: A timestamp giving the time the report was created.
- **installation_id**: This is a randomized UUID unique to your Mathesar installation.
- **mathesar_version**: This is a string giving your Mathesar version, e.g., '0.2.0'.
- **user_count**: The number of user accounts on your Mathesar installation.
- **active_user_count**: The number of users who have logged into your Mathesar installation within the last 14 days.
- **configured_role_count**: The number of PostgreSQL roles you've configured in your Mathesar installation.
- **connected_database_count**: The number of Databases you've connected to your Mathesar installation.
- **connected_database_schema_count**: The total number of schemas connected to your Mathesar installation.
- **connected_database_table_count**: The total number of tables connected to your Mathesar installation.
- **connected_database_record_count**: The approximate number of records in all tables connected to your Mathesar installation.
- **exploration_count**: The number of Explorations you've created in Mathesar.

## Viewing Actual Reports

If you'd like to see an actual report from your running Mathesar installation, go to the path `/info/analytics_sample_report/` at the domain where you connect to Mathesar. You can also call the RPC function [`analytics.view_report`](../../api/methods#analytics.view_report).
