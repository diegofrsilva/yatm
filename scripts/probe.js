// Probe window for headless checks: prints "<epoch-ms> <name> <W>x<H>" whenever its size
// changes, and "<epoch-ms> monitor <W>x<H>" whenever the monitor size changes.
imports.gi.versions.Gtk = '4.0';
const { Gtk, Gdk, Gio, GLib } = imports.gi;
const name = ARGV[0];
const app = new Gtk.Application({ application_id: 'dev.yatm.Probe', flags: Gio.ApplicationFlags.NON_UNIQUE });
app.connect('activate', () => {
    const win = new Gtk.ApplicationWindow({ application: app, title: name, default_width: 400, default_height: 300 });
    let last = '';
    let last_monitor = '';
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
        const now = Math.floor(GLib.get_real_time() / 1000);
        const s = `${win.get_width()}x${win.get_height()}`;
        if (s !== last) {
            last = s;
            print(`${now} ${name} ${s}`);
        }
        const g = Gdk.Display.get_default().get_monitors().get_item(0).get_geometry();
        const m = `${g.width}x${g.height}`;
        if (m !== last_monitor) {
            last_monitor = m;
            print(`${now} monitor ${m}`);
        }
        return true;
    });
    win.present();
});
app.run([]);
