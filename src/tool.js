/*! Eretek Online Araçlar #50 — Fiziksel Sunucu Konsolidasyon Planlayıcı */
ERT.def('50', {
	run: function (v, c) {
		var r = c.csv(v.csv, 'csv', 5000), H = r.head, col = function (n) { return ERT.csv.col(H, n); };
		var iN = col(['server', 'name', 'sunucu']), iC = col(['cores', 'vcpu', 'cpu']), iP = col(['cpu_peak', 'peak_cpu', 'cpu_pct']), iR = col(['ram_gb', 'ram']), iU = col(['ram_used_gb', 'ram_used']), iD = col(['disk_gb', 'disk']), iG = col(['group', 'dependency', 'bagimlilik']);
		if (iN < 0 || iC < 0 || iR < 0) { throw c.fe('csv', 'col', { c: 'server, cores, ram_gb' }); }
		var g = 1 + (v.growth || 0) / 100, totV = 0, totR = 0, totD = 0, rows = [], cls = [], missing = 0, groups = {};
		r.rows.forEach(function (x, i) {
			var cores = ERT.parseNum(x[iC], 'en'), peak = iP >= 0 && x[iP] !== '' ? ERT.parseNum(x[iP], 'en') : null, ram = ERT.parseNum(x[iR], 'en'), used = iU >= 0 && x[iU] !== '' ? ERT.parseNum(x[iU], 'en') : null, disk = iD >= 0 && x[iD] !== '' ? ERT.parseNum(x[iD], 'en') : 0;
			if (!(cores > 0) || !(ram > 0) || isNaN(disk) || (peak !== null && isNaN(peak)) || (used !== null && isNaN(used))) { throw c.fe('csv', 'rowNum', { r: i + 2 }); }
			var notes = [];
			if (peak === null) { notes.push(c.t('noCpu')); peak = 100; missing++; }
			if (used === null) { notes.push(c.t('noRam')); used = ram; missing++; }
			var needV = Math.max(1, Math.ceil(cores * peak / 100 * g * 1.25)), needR = Math.ceil(used * g * 1.1);
			totV += needV; totR += needR; totD += disk;
			var grp = iG >= 0 ? x[iG] : ''; if (grp) { (groups[grp] = groups[grp] || []).push(x[iN]); }
			rows.push([x[iN], cores, c.pct(peak / 100, 0), ram, used, needV, needR, disk, grp || '–', notes.join('; ') || '–']); cls.push(notes.length ? 'warn' : '');
		});
		var hostV = v.hcores * v.ratio, hostR = v.hram - (v.hresv || 0);
		var hosts = Math.max(Math.ceil(totV / hostV), Math.ceil(totR / hostR)), withN1 = hosts + 1;
		var msgs = [['info', c.t('sizing', { h: '25', r: '10' })]];
		if (missing) { msgs.push(['warn', c.t('missing', { n: missing })]); }
		Object.keys(groups).forEach(function (k) { if (groups[k].length > 1) { msgs.push(['info', c.t('grp', { g: k, l: groups[k].join(', ') })]); } });
		var cols = [c.t('c_srv'), c.t('c_cores'), c.t('c_peak'), 'RAM GB', c.t('c_used'), c.t('c_nv'), c.t('c_nr'), c.t('c_disk'), c.t('c_grp'), c.t('c_note')];
		return { big: c.t('big', { h: hosts, n: withN1 }), kv: [[c.t('totV'), totV + ' vCPU'], [c.t('totR'), totR + ' GiB'], [c.t('totD'), c.n(totD, 0) + ' GB'], [c.t('perHost'), c.n(hostV, 0) + ' vCPU / ' + c.n(hostR, 0) + ' GiB']], msgs: msgs, tables: [{ cols: cols, rows: rows, cls: cls }], x: { csv: { name: 'consolidation', cols: cols, rows: rows } }, v: { hosts: hosts, missing: missing, totV: totV, totR: totR } };
	}
});
