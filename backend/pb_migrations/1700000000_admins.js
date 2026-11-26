/// <reference path="../pb_data/types.d.ts" />
// "users" (built-in) = customer app accounts, open sign-up.
// "admins" = turf-owner app accounts; created only from the dashboard (createRule null).
migrate((app) => {
  const admins = new Collection({
    type: "auth",
    name: "admins",
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    createRule: null,
    updateRule: "id = @request.auth.id",
    deleteRule: null,
    fields: [{ name: "name", type: "text" }],
  });
  app.save(admins);

  const s = app.settings();
  s.meta.appName = "BookMyTurf";
  s.rateLimits.enabled = true; // default rules throttle auth endpoints
  app.save(s);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("admins"));
});
