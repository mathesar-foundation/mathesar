-- Pre-seed legacy msar and __msar schemas on the test-user-db so the
-- api_tests scenario can exercise databases.remove_mathesar_schemas
-- end-to-end.
--
-- The cleanup function and catalog table are now in pg_temp (loaded
-- per-session by the uninstall path), so we only need the permanent
-- schemas to simulate a legacy DB. The e2e test proves the full
-- RPC -> Django -> PG stack works; the pgTAP suite (test_msar_remove.sql)
-- covers SQL-level correctness.

CREATE SCHEMA msar;
CREATE SCHEMA __msar;
