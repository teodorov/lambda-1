"use strict";

const fs = require("fs");
const path = require("path");

const template = fs.readFileSync(path.join(__dirname, "template.txt"), "utf8");

let mkwire, mktwins, getfv;

function psi(shared, list)
{
	shared.forEach((twins, atom) => {
		const wleft = twins.left;
		const wright = twins.right;
		const agent = `\\fan_{0}`;
		const tree = `${agent}(${wright}, ${wleft})`;

		list.push(`${atom} = ${tree}`);
	});
}

function mkscope(n, s)
{
	for (let i = 0; i < n; i++)
		s = `\\scope_{0}(${s})`;

	return s;
}

function gamma(obj, root, list)
{
	const node = obj.node;

	if ("atom" == node) {
		if (obj.free) {
			const name = `this.mkid(${obj.name})`;
			const agent = `\\atom_{${name}}`;

			list.push(`${root} = ${agent}`);
		} else {
			const agent = mkscope(obj.index, root);

			list.push(`${obj.name} = ${agent}`);
		}
	} else if ("abst" == node) {
		const id = obj.var;
		const body = obj.body;
		const fv = getfv(body);
		const wire = mkwire();
		const agent = (id in fv) ? id : "\\erase";
		const tree = `\\lambda(${agent}, ${wire})`;

		list.push(`${root} = ${tree}`);

		gamma(body, wire, list);
	} else if ("appl" == node) {
		const wleft = mkwire();
		const wright = mkwire();
		const left = obj.left;
		const right = obj.right;
		const shared = mktwins(left, right);
		const agent = `\\apply(${wright}, ${root})`;

		list.push(`${wleft} = ${agent}`);

		gamma(left, wleft, list);
		gamma(right, wright, list);

		psi(shared, list);
	}
}

function encode(generic, term)
{
	const inconfig = [
		"\\read_{this.mkhole()}(!print) = root"
	];

	mkwire = generic.mkwire;
	mktwins = generic.mktwins;
	getfv = generic.getfv;

	gamma(term, "root", inconfig);

	inconfig.inet = template;
	return inconfig;
}

module.exports = encode;
