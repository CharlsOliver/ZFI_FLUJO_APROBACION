/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zfi_flujo_aprobacion/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
