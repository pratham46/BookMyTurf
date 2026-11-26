/// <reference path="../pb_data/types.d.ts" />
// admins got no created/updated fields at creation (users has them built in); the control panel sorts by them.
// Also turn off "new login location" alert emails: there's no mail server, so every new-device login logged an error.
migrate((app) => {
  const admins = app.findCollectionByNameOrId("admins");
  admins.fields.add(new AutodateField({ name: "created", onCreate: true }));
  admins.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(admins);
  // existing owners: stamp now so they sort sensibly
  app.db().newQuery("UPDATE admins SET created = strftime('%Y-%m-%d %H:%M:%fZ','now'), updated = strftime('%Y-%m-%d %H:%M:%fZ','now') WHERE created = ''").execute();

  for (const name of ["users", "admins"]) {
    const c = app.findCollectionByNameOrId(name);
    c.authAlert.enabled = false;
    app.save(c);
  }
}, (app) => {
  const admins = app.findCollectionByNameOrId("admins");
  admins.fields.removeByName("created");
  admins.fields.removeByName("updated");
  app.save(admins);
});
