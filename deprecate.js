const notify = require('umi-notify');

process.env.MONITOR = 1;
notify.onDevComplete({ name: 'atool-build', version: 1 });
