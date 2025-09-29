import type { Knex } from 'knex';

const TABLE = 'traveler_profiles';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable(TABLE);
  if (exists) return;

  await knex.schema.createTable(TABLE, (table) => {
    table.string('profile_id', 36).primary();
    table.string('display_name');
    table.string('home_location');
    table.text('interest_tags').notNullable().defaultTo('[]');
    table.string('assistant_voice_id').notNullable();
    table.string('narration_voice_id').notNullable();
    table.boolean('transcript_opt_in').notNullable().defaultTo(false);
    table.string('consent_version').notNullable();
    table.string('consent_accepted_at').notNullable();
    table.integer('retention_days').notNullable().defaultTo(30);
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.string('deleted_at');
    table.string('deletion_request_id');
    table.text('metadata');

    table.index(['deleted_at', 'updated_at'], 'idx_profiles_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE);
}
