/// <reference path="../../TypeScriptDefinitions/bootstrap.d.ts" />
/// <reference path="../../TypeScriptDefinitions/crypto-js.d.ts" />
/// <reference path="../../TypeScriptDefinitions/highcharts.d.ts" />
/// <reference path="../../TypeScriptDefinitions/HighChartsCrossingSpecificValue.d.ts" />
/// <reference path="../../TypeScriptDefinitions/highchartsDraggable.d.ts" />
/// <reference path="../../TypeScriptDefinitions/jquery.d.ts" />
/// <reference path="../../TypeScriptDefinitions/knockout.d.ts" />
/// <reference path="../../TypeScriptDefinitions/PortalClient.d.ts" />
/// <reference path="../../TypeScriptDefinitions/require.d.ts" />
/// <reference path="../../TypeScriptDefinitions/routie.d.ts" />
/// <reference path="../../TypeScriptDefinitions/SoundManager.d.ts" />
/// <reference path="../../TypeScriptDefinitions/videojs.d.ts" />
/// <reference path="../../TypeScriptDefinitions/taggle.d.ts" />
/// <reference path="../../TypeScriptDefinitions/vis.d.ts" />
/// <reference path="../../TypeScriptDefinitions/moment.d.ts" />

declare module "PortalClient" { export = CHAOS.Portal.Client }
declare var CacheBuster: number;
declare module "text!../../configuration.json" { var configuration: string; export = configuration; }

requirejs.config({
	paths: {
		text: "../lib/text/text",
		jquery: "../lib/jQuery/jquery.min",
		routie: "../lib/Routie/routie.min",
		knockout: "../lib/knockout/knockout",
		bootstrap: "../lib/bootstrap/js/bootstrap.min",
		PortalClient: "../lib/PortalClient/PortalClient.min",
		Highcharts: "../lib/Highcharts/highcharts",
		HighchartsMore: "../lib/Highcharts/highcharts-more",
		HighChartsDraggablePoints: "../lib/Highcharts/draggable-points/draggable-points",
		HighChartsCrossingSpecificValue: "../lib/Highcharts/crossing-specific-value/crossing-specific-value",
		"crypto-js": "../lib/crypto-js/md5",
		soundmanager2: "../lib/soundmanager2/script/soundmanager2-nodebug-jsmin",
		Taggle: "../lib/taggle/taggle",
		vis: "../lib/vis/vis.min",
		moment: "../lib/moment/moment.min",
	},
	map: {
		"*": {
			css: "../lib/require-css/css.min"
		}
	},
	shim: {
		routie: {
			exports: "routie"
		},
		bootstrap: {
			deps: [
				"jquery",
				"css!../lib/bootstrap/css/bootstrap.min",
				"css!../lib/bootstrap/css/bootstrap-theme.min"
			]
		},
		Highcharts: {
			exports: "Highcharts",
			deps: ["jquery"]
		},
		HighchartsMore: {
			deps: ["jquery", "Highcharts"]
		},
		HighChartsDraggablePoints: {
			deps: ["jquery", "Highcharts", "HighchartsMore"]
		},
		HighChartsCrossingSpecificValue: {
			deps: ["jquery", "Highcharts", "HighchartsMore"]
		},
		PortalClient: {
			exports: "CHAOS.Portal.Client"
		},
		"crypto-js": {
			exports: "CryptoJS"
		},
		Taggle: {
			deps: ["css!../lib/taggle/taggle"]
		},
		vis: {
			deps: [
				"css!../lib/vis/vis.min"
			]
		}
	},
	deps: ["Main", "bootstrap", "css!Style/default", "KnockoutBindings/KnockoutBindings"],
	waitSeconds: 20,
	urlArgs: "bust=" + CacheBuster
});