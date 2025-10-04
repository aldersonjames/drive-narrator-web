import type { Knex } from 'knex';

const DRIVES = 'drives';
const ROUTE_OPTIONS = 'route_options';
const POINTS_OF_INTEREST = 'points_of_interest';
const NARRATION_SESSIONS = 'narration_sessions';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(DRIVES))) {
    await knex.schema.createTable(DRIVES, (table) => {
      table.string('drive_id', 36).primary();
      table.string('profile_id', 36).notNullable();
      table.string('origin_raw').notNullable();
      table.string('origin_hash').notNullable();
      table.string('destination_raw').notNullable();
      table.string('destination_hash').notNullable();
      table.string('departure_time').notNullable();
      table.text('interest_tags').notNullable().defaultTo('[]');
      table
        .enu('status', ['draft', 'planned', 'completed', 'archived', 'pending_deletion'], {
          useNative: false,
          enumName: 'drive_status',
        })
        .notNullable()
        .defaultTo('draft');
      table.string('created_at').notNullable();
      table.string('updated_at').notNullable();
      table.string('last_accessed_at');

      table.index(['profile_id', 'status', 'updated_at'], 'idx_drives_profile_status');
    });
  }

  if (!(await knex.schema.hasTable(ROUTE_OPTIONS))) {
    await knex.schema.createTable(ROUTE_OPTIONS, (table) => {
      table.string('route_id', 36).primary();
      table.string('drive_id', 36).notNullable();
      table.string('source').notNullable();
      table.text('polyline').notNullable();
      table.float('duration_minutes').notNullable();
      table.float('distance_km').notNullable();
      table.float('score').notNullable();
      table.text('score_breakdown').notNullable().defaultTo('{}');
      table.text('warnings').notNullable().defaultTo('[]');
      table.string('created_at').notNullable();

      table.index(['drive_id'], 'idx_route_drive');
    });
  }

  if (!(await knex.schema.hasTable(POINTS_OF_INTEREST))) {
    await knex.schema.createTable(POINTS_OF_INTEREST, (table) => {
      table.string('poi_id', 36).primary();
      table.string('route_id', 36).notNullable();
      table.string('external_id');
      table.string('provider').notNullable();
      table.string('category').notNullable();
      table.float('relevance').notNullable();
      table.float('coordinates_lat').notNullable();
      table.float('coordinates_lng').notNullable();
      table.text('summary').notNullable();
      table.text('narration_script').notNullable();
      table.string('narration_preview').notNullable();
      table.integer('eta_offset_seconds').notNullable().defaultTo(0);
      table.text('attribution').notNullable().defaultTo('{}');
      table.string('created_at').notNullable();

      table.index(['route_id'], 'idx_poi_route');
    });
  }

  if (!(await knex.schema.hasTable(NARRATION_SESSIONS))) {
    await knex.schema.createTable(NARRATION_SESSIONS, (table) => {
      table.string('session_id', 36).primary();
      table.string('drive_id', 36).notNullable();
      table.string('profile_id', 36).notNullable();
      table
        .enu('status', ['scheduled', 'in_progress', 'completed', 'paused', 'pending_deletion'], {
          useNative: false,
          enumName: 'narration_status',
        })
        .notNullable()
        .defaultTo('scheduled');
      table.string('started_at');
      table.string('completed_at');
      table.text('events').notNullable().defaultTo('[]');
      table.string('transcript_path');
      table.text('audio_cache_keys').defaultTo('[]');
      table.string('created_at').notNullable();
      table.string('updated_at').notNullable();

      table.index(['drive_id', 'status'], 'idx_sessions_drive_status');
      table.index(['profile_id'], 'idx_sessions_profile');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(NARRATION_SESSIONS);
  await knex.schema.dropTableIfExists(POINTS_OF_INTEREST);
  await knex.schema.dropTableIfExists(ROUTE_OPTIONS);
  await knex.schema.dropTableIfExists(DRIVES);
}
