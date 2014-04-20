/*global afterEach, beforeEach, describe, it */
'use strict';

var assert = require('assert');
var binCheck = require('bin-check');
var BinWrapper = require('bin-wrapper');
var fs = require('fs');
var path = require('path');
var spawn = require('win-spawn');
var rm = require('rimraf');

describe('optipng()', function () {
	afterEach(function (cb) {
		rm(path.join(__dirname, 'tmp'), cb);
	});

	beforeEach(function (cb) {
		fs.mkdir(path.join(__dirname, 'tmp'), cb);
	});

	it('should rebuild the optipng binaries', function (cb) {
		var bin = new BinWrapper({ bin: 'optipng', version: '0.7.4', global: false, dest: path.join(__dirname, 'tmp') });
		var bs = './configure --with-system-zlib ' +
				 '--mandir="' + path.join(bin.dest, 'man') + '" ' +
				 '--bindir="' + bin.dest + '" && ' +
				 'make install';

		bin
			.addSource('http://downloads.sourceforge.net/project/optipng/OptiPNG/optipng-0.7.4/optipng-0.7.4.tar.gz')
			.build(bs)
			.on('finish', function () {
				cb(assert(true));
			});
	});

	it('should return path to binary and verify that it is working', function (cb) {
		var binPath = require('../').path;

		binCheck(binPath, '--version', function (err, works) {
			cb(assert.equal(works, true));
		});
	});

	it('should minify a PNG', function (cb) {
		var binPath = require('../').path;
		var args = [
			'-strip', 'all',
			'-clobber',
			'-out', path.join(__dirname, 'tmp/test.png'),
			path.join(__dirname, 'fixtures', 'test.png')
		];

		spawn(binPath, args).on('close', function () {
			var src = fs.statSync(path.join(__dirname, 'fixtures/test.png')).size;
			var dest = fs.statSync(path.join(__dirname, 'tmp/test.png')).size;

			assert(dest < src);
			assert(dest > 0);
			cb();
		});
	});

	it('should minify a PNG using stdin and stdout', function (cb) {
		var cp = require('../').stream;
		var src = path.join(__dirname, 'fixtures/test.png');
		var dest = path.join(__dirname, 'tmp/test.png');
		var args = [
			'-strip', 'all',
			'-clobber',
			'-o7'
		];

		fs.createReadStream(src)
			.pipe(cp(args))
			.pipe(fs.createWriteStream(dest))
				.on('close', function () {
					assert.ok(fs.statSync(dest).size < fs.statSync(src).size);
					assert.ok(fs.statSync(dest).size > 0);
					cb();
				});
	});
});
