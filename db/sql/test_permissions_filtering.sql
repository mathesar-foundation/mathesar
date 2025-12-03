CREATE OR REPLACE FUNCTION __setup_permissions_filtering() RETURNS SETOF TEXT AS $$
BEGIN
    -- Create roles
    -- We check existence to avoid errors if roles persist (though pgTAP usually rolls back, CREATE ROLE is non-transactional)
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'test_restricted_user') THEN
        CREATE ROLE test_restricted_user LOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'other_user') THEN
        CREATE ROLE other_user;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'db_creator') THEN
        CREATE ROLE db_creator LOGIN;
    END IF;

    -- Create schemas
    CREATE SCHEMA visible_schema;
    CREATE SCHEMA hidden_schema;
    CREATE SCHEMA create_only_schema;
    CREATE SCHEMA other_schema AUTHORIZATION other_user;
    
    -- Create tables
    CREATE TABLE visible_schema.visible_table (id int);
    CREATE TABLE hidden_schema.hidden_table (id int);
    CREATE TABLE create_only_schema.admin_table (id int);
    CREATE TABLE visible_schema.hidden_table_in_visible_schema (id int);
    
    -- Grants
    GRANT USAGE ON SCHEMA visible_schema TO test_restricted_user;
    GRANT SELECT ON visible_schema.visible_table TO test_restricted_user;
    GRANT CREATE ON SCHEMA create_only_schema TO test_restricted_user;
    GRANT CREATE ON DATABASE mathesar_testing TO db_creator;
    
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_permissions_filtering() RETURNS SETOF TEXT AS $$
BEGIN
    PERFORM __setup_permissions_filtering();
    
    -- Switch to restricted user
    SET ROLE test_restricted_user;
    
    -- Test 1: hidden_schema should NOT be in list_schemas
    RETURN NEXT ok(
        NOT jsonb_path_exists(msar.list_schemas(), '$[*] ? (@.name == "hidden_schema")'),
        'Hidden schema should not be visible to restricted user'
    );
    
    -- Test 2: visible_schema SHOULD be in list_schemas
    RETURN NEXT ok(
        jsonb_path_exists(msar.list_schemas(), '$[*] ? (@.name == "visible_schema")'),
        'Visible schema should be visible to restricted user'
    );
    
    -- Test 3: hidden_table_in_visible_schema should NOT be in get_table_info('visible_schema')
    RETURN NEXT ok(
        NOT jsonb_path_exists(msar.get_table_info('visible_schema'), '$[*] ? (@.name == "hidden_table_in_visible_schema")'),
        'Hidden table in visible schema should not be visible to restricted user'
    );
    
    -- Test 4: visible_table should be in get_table_info('visible_schema')
    RETURN NEXT ok(
        jsonb_path_exists(msar.get_table_info('visible_schema'), '$[*] ? (@.name == "visible_table")'),
        'Visible table in visible schema should be visible to restricted user'
    );
    
    -- Test 5: create_only_schema SHOULD be in list_schemas
    RETURN NEXT ok(
        jsonb_path_exists(msar.list_schemas(), '$[*] ? (@.name == "create_only_schema")'),
        'Schema with CREATE permission should be visible to restricted user'
    );
    
    -- Test 6: admin_table in create_only_schema SHOULD be in get_table_info because user has CREATE on schema
    RETURN NEXT ok(
        jsonb_path_exists(msar.get_table_info('create_only_schema'), '$[*] ? (@.name == "admin_table")'),
        'Table without permissions in a CREATE-only schema SHOULD be visible'
    );
    
    SET ROLE NONE;
    
    -- Test 7: Admin (superuser/owner) should see hidden_schema
    RETURN NEXT ok(
        jsonb_path_exists(msar.list_schemas(), '$[*] ? (@.name == "hidden_schema")'),
        'Admin should see hidden schema'
    );
    
    -- Test 8: Admin (superuser/owner) should see hidden_table in hidden_schema
    RETURN NEXT ok(
        jsonb_path_exists(msar.get_table_info('hidden_schema'), '$[*] ? (@.name == "hidden_table")'),
        'Admin should see hidden table'
    );
    
    -- Test 9: User with CREATE on Database should see hidden schema
    SET ROLE db_creator;
    
    RETURN NEXT ok(
        jsonb_path_exists(msar.list_schemas(), '$[*] ? (@.name == "hidden_schema")'),
        'User with CREATE on Database should see hidden schema'
    );
    
    SET ROLE NONE;
    
END;
$$ LANGUAGE plpgsql;
