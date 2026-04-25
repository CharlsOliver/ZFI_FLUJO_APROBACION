sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "zfiflujoaprobacion/model/formatter",
    "sap/m/MessageBox"
],
    function (Controller, MessageToast, Fragment, Filter, FilterOperator, formatter, MessageBox) {
        "use strict";

        return Controller.extend("zfiflujoaprobacion.controller.Main", {

            formatter: formatter,

            onInit: function () {
                this.oRouter = this.getOwnerComponent().getRouter();
                this.ZSERV_PPL_GETID_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_GETID_SRV");
                this.ZSERV_PPL_FLUJOID_SH_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_FLUJOID_SH_SRV");
                this.ZSERV_PPL_GETDOCS_PROV_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_GETDOCS_PROV_SRV");
                this.ZSERV_PPL_CREAFLUJO_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_CREAFLUJO_SRV");
                this.ZSERV_PPL_SHELP_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_SHELP_SRV");
                this.ZSERV_PPL_PRINT_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_PRINT_SRV");
                this.ZSERV_PPL_CHECKUSR_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_CHECKUSR_SRV");
                this.oFlujos = this.getOwnerComponent().getModel("Flujos");
                this.oAprobadores = this.getOwnerComponent().getModel("Aprobadores");
                this.oSociedades = this.getOwnerComponent().getModel("Sociedades");
                this.oAcreedores = this.getOwnerComponent().getModel("Acreedores");
                this.oMonedas = this.getOwnerComponent().getModel("Monedas");
                this.oAdjuntos = this.getOwnerComponent().getModel("Adjuntos");
                this.oDocumentos = this.getOwnerComponent().getModel("Documentos");
                this.oDocumentosSeleccionados = this.getOwnerComponent().getModel("DocumentosSeleccionados");
                this.oRouter.getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);
                this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            _onObjectMatched: async function () {
                this.aAprobadores = []
                this.oAdjuntos.setData([]);
                this.oDocumentosSeleccionados.setData([]);
                this.inptReqId = this.getView().byId("inptReqId");
                this.txtAObservaciones = this.getView().byId("txtAObservaciones");
                this.inptConcepto = this.getView().byId("inptConcepto");
                this.inptCorreo = this.getView().byId("inptCorreo");
                this.cboxFlujo = this.getView().byId("cboxFlujo");
                this.cboxSociedad = this.getView().byId("cboxSociedad");
                this.cboxAcreedor = this.getView().byId("cboxAcreedor");
                this.cboxMoneda = this.getView().byId("cboxMoneda");
                this.inptImporte = this.getView().byId("inptImporte");
                this.rbgMetodoPago = this.getView().byId("rbgMetodoPago");

                if (sap.ushell && sap.ushell.Container) {
                    this.oUser = sap.ushell.Container.getUser();
                    this.sUserId = this.oUser.getId();
                    //this.sUserId = "RREYES";
                } else {
                    this.sUserId = "RREYES";
                }
                console.log("Usuario Fiori:", this.sUserId);

                const valid = await this._onValidateUser();

                if (!valid) {
                    MessageBox.alert('Usuario no autorizado para generar flujos. Registrese en Transacción "ZPPL_UPD_CTRLCON" e intente de nuevo.');
                    return
                } else {
                    this.onCrearRequisicion();
                    this.onCargarDropdowns();
                }
            },

            onCrearRequisicion: async function () {
                const that = this;
                const valid = await this._onValidateUser();
                if (!valid) {
                    MessageBox.alert('Usuario no autorizado para generar flujos. Registrese en Transacción "ZPPL_UPD_CTRLCON" e intente de nuevo.');
                    return
                }
                this.ZSERV_PPL_GETID_SRV.read(`/IDSet('${this.sUserId}')`, {
                    urlParameters: {
                        "format": "json"
                    },
                    success: function (response) {
                        if (response["ReqId"] !== "" && response["ReqId"] !== null) {
                            that.inptReqId.setValue(response["ReqId"]);
                        } else {
                            MessageToast.show(that.oBundle.getText("requisicion.message.create.error", [that.sUserId]));
                        }
                    },
                    error: function (error) {
                        console.log(error)
                    }
                });
            },

            onCargarDropdowns: function () {
                const that = this;
                const aValores = ["1", "2", "3", "4"];
                const aPromesas = aValores.map((valor) => {
                    return new Promise((resolve, reject) => {
                        this.ZSERV_PPL_FLUJOID_SH_SRV.read("/InputSet", {
                            urlParameters: {
                                "$filter": `Campo eq '${valor}'`,
                                "$expand": "ValNav,AprobNav"
                            },
                            success: function (oData) {
                                resolve(oData.results);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                });

                Promise.all(aPromesas).then((aResultados) => {
                    const aAllResponse = aResultados.flat();
                    that.oFlujos.setData(aAllResponse[0]["ValNav"]["results"]);
                    that.aAprobadores = aAllResponse[0]["AprobNav"]["results"];
                    that.oSociedades.setData(aAllResponse[1]["ValNav"]["results"]);
                    that.oMonedas.setData(aAllResponse[3]["ValNav"]["results"]);
                }).catch((err) => {
                    console.error("Error al consultar el OData:", err);
                });
            },

            onFilterAprobadores: function (value) {
                if (value) {
                    var aAprobadoresFiltrados = [];
                    if (value !== "" && value !== null && value !== undefined) {
                        aAprobadoresFiltrados = this.aAprobadores.filter(item => item.Id_flow === value);
                    }
                    this.oAprobadores.setData(aAprobadoresFiltrados);
                } else {
                    this.oAprobadores.setData([]);
                }
            },

            onChangeArchivo: function (oEvent) {
                const that = this;
                const oFile = oEvent.getParameter("files")[0];

                if (oFile) {
                    const oUploader = oEvent.getSource();
                    const reader = new FileReader();

                    reader.onload = function (evt) {
                        const arrayBuffer = evt.target.result;
                        const byteArray = new Uint8Array(arrayBuffer);
                        const sHex = Array.from(byteArray)
                            .map(byte => byte.toString(16).padStart(2, '0'))
                            .join('');

                        const aData = that.oAdjuntos.getData() || [];

                        const bExists = aData.some(function (item) {
                            return item.File_name === oFile.name;
                        });

                        if (bExists) {
                            MessageToast.show("El archivo ya fue cargado.");
                            oUploader.setValue("");
                            return;
                        }

                        aData.push({
                            File_name: oFile.name,
                            File_cont: sHex,
                            File_type: oFile.type,
                            ProductPicUrl: "",
                        });

                        that.oAdjuntos.setData(aData);
                        oUploader.setValue("");
                    };

                    reader.readAsArrayBuffer(oFile);
                }
            },

            onEliminarArchivo: function (oEvent) {
                var oItem = oEvent.getParameter("listItem");
                var oContext = oItem.getBindingContext("Adjuntos");
                var sPath = oContext.getPath();
                var iIndex = parseInt(sPath.split("/")[1], 10);

                var aData = this.oAdjuntos.getData();
                aData.splice(iIndex, 1);
                this.oAdjuntos.setData(aData);
            },

            onBuscarDocumentos: function () {
                const sociedad = this.cboxSociedad.getSelectedKey();
                const acreedor = this.cboxAcreedor.getValue();
                const moneda = this.cboxMoneda.getSelectedKey();
                if (sociedad === null || sociedad === "" || sociedad === undefined) {
                    MessageToast.show("Seleccione una sociedad.");
                    return
                } else if (acreedor === null || acreedor === "" || acreedor === undefined) {
                    MessageToast.show("Seleccione un acreedor.");
                    return
                } else if (moneda === null || moneda === "" || moneda === undefined) {
                    MessageToast.show("Seleccione una moneda.");
                    return
                } else {
                    if (!this._oDialogDocumentos) {
                        Fragment.load({
                            id: this.getView().createId("dDocumentos"),
                            name: "zfiflujoaprobacion.view.fragment.Documentos",
                            controller: this
                        }).then(function (oDialog) {
                            this._oDialogDocumentos = oDialog;
                            this.getView().addDependent(oDialog);
                            oDialog.open();
                        }.bind(this));
                    } else {
                        this._oDialogDocumentos.open();
                    }
                }
            },

            onCloseDialog: function () {
                this._oDialogDocumentos.close();
            },

            onLoadDocumentos: function (sociedad, fecha, proveedor, moneda) {
                const that = this;
                return new Promise(function (resolve, reject) {
                    const aFilter = [];

                    aFilter.push(new Filter("Soc", FilterOperator.EQ, sociedad));
                    aFilter.push(new Filter("Fec", FilterOperator.EQ, fecha));
                    aFilter.push(new Filter("Prov", FilterOperator.EQ, proveedor));
                    aFilter.push(new Filter("Mon", FilterOperator.EQ, moneda));

                    that.ZSERV_PPL_GETDOCS_PROV_SRV.read("/InputSet", {
                        filters: aFilter,
                        urlParameters: {
                            "format": "json",
                            "$expand": "Indocnav"
                        },
                        success: function (response) {
                            const aDocs = response?.results?.[0]?.Indocnav?.results || [];
                            that.oDocumentos.setData(aDocs);
                            resolve();
                        },
                        error: function (error) {
                            that.oDocumentos.setData([]);
                            reject(error);
                        }
                    });
                });
            },

            onSeleccionarDocs: function () {
                const oTable = Fragment.byId(this.createId("dDocumentos"), "tblDocumentos");
                const aSelectedItems = oTable.getSelectedItems();
                let importe = 0;

                const aNuevosSeleccionados = [];

                aSelectedItems.forEach(item => {
                    const oContext = item.getBindingContext("Documentos");
                    const oDoc = oContext.getObject();
                    oDoc["Bldat"] = formatter.formatearFechaSAP(oDoc["Bldat"]);
                    importe += parseFloat(oDoc["Dmshb"])
                    aNuevosSeleccionados.push(oDoc);
                });

                const currency = this.cboxMoneda.getSelectedKey();
                const importeFormateado = new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: currency
                }).format(importe);
                this.inptImporte.setValue(importeFormateado);
                this.oDocumentosSeleccionados.setData(aNuevosSeleccionados);

                if (aNuevosSeleccionados.length > 0) {
                    MessageToast.show(this.oBundle.getText("form.documentos.seleccionados", [aNuevosSeleccionados.length]));
                } else {
                    MessageToast.show("No se seleccionó ningún documento.");
                }

                this._oDialogDocumentos.close();
            },

            preseleccionarDocumentos: function () {
                const oTable = Fragment.byId(this.createId("dDocumentos"), "tblDocumentos");
                const aItems = oTable.getItems();
                const aSeleccionados = this.oDocumentosSeleccionados.getData() || [];

                aItems.forEach(item => {
                    const oContext = item.getBindingContext("Documentos");
                    const oDoc = oContext.getObject();
                    const bExiste = aSeleccionados.some(d => {
                        const keys = Object.keys(oDoc).filter(k => k !== "__metadata");
                        return keys.every(k => d[k] === oDoc[k]);
                    });
                    if (bExiste) {
                        oTable.setSelectedItem(item, true);
                    }
                });
            },

            onIniciarFlujo: function () {
                const that = this;
                const oView = this.getView()
                oView.setBusy(true);
                const requisicion = this.inptReqId.getValue();
                const flujo = this.cboxFlujo.getSelectedKey();
                const sociedad = this.cboxSociedad.getSelectedKey();
                const acreedor = this.cboxAcreedor.getValue();
                const moneda = this.cboxMoneda.getSelectedKey();
                const concepto = this.inptConcepto.getValue();
                const correo = this.inptCorreo.getValue();
                const importe = this.inptImporte.getValue().replace("$", "").replace(",", "");
                const documentos = this.oDocumentosSeleccionados.getData();
                const adjuntos = this.oAdjuntos.getData();
                const comentarios = this.txtAObservaciones.getValue();
                const metodoPago = this.rbgMetodoPago.getSelectedIndex() + 1;

                if (requisicion === "" || requisicion === null || requisicion === undefined) {
                    MessageToast.show("Genere un número requisicion.")
                    oView.setBusy(false);
                    return;
                } else if
                    (flujo === "" || flujo === null || flujo === undefined) {
                    MessageToast.show("Seleccione un flujo.")
                    oView.setBusy(false);
                    return;
                } else if
                    (sociedad === "" || sociedad === null || sociedad === undefined) {
                    MessageToast.show("Seleccione una sociedad.")
                    oView.setBusy(false);
                    return;
                } else if
                    (acreedor === "" || acreedor === null || acreedor === undefined) {
                    MessageToast.show("Seleccione un acreedor.")
                    oView.setBusy(false);
                    oView.setBusy(false);
                    return;
                } else if
                    (moneda === "" || moneda === null || moneda === undefined) {
                    MessageToast.show("Seleccione una moneda.")
                    oView.setBusy(false);
                    return;
                } else if
                    (concepto === "" || concepto === null || concepto === undefined) {
                    MessageToast.show("Ingrese un concepto.")
                    oView.setBusy(false);
                    return;
                } else if
                    (correo === "" || correo === null || correo === undefined) {
                    MessageToast.show("Ingrese un correo electrónico para tesoreria.")
                    oView.setBusy(false);
                    return;
                } else if (importe === "" || importe === null || importe === undefined) {
                    MessageToast.show("Ingrese un importe.")
                    oView.setBusy(false);
                    return;
                } else if (comentarios === "" || comentarios === null || comentarios === undefined) {
                    MessageToast.show("Ingrese comentarios.")
                    oView.setBusy(false);
                    return;
                } else if (metodoPago === "" || metodoPago === null || metodoPago === undefined) {
                    MessageToast.show("Seleccione un método de pago.")
                    oView.setBusy(false);
                    return;
                } else {
                    let body = {
                        "Flujo_id": flujo,
                        "Req_id": requisicion,
                        "Sociedad": sociedad,
                        "Proveedor": acreedor,
                        "Moneda": moneda,
                        "Concepto": concepto,
                        "Correo": correo,
                        "Importe": importe,
                        "Metodop": metodoPago.toString(),
                        "Observaciones": comentarios,
                        "HeaderDocsNav": documentos.map(documento => ({
                            Xblnr: documento.Xblnr,
                            Belnr: documento.Belnr,
                            Blart: documento.Blart,
                            Bldat: documento.Bldat,
                            Dmshb: documento.Dmshb,
                            Hwaer: documento.Hwaer,
                            Wrshb: documento.Wrshb,
                            Waers: documento.Waers,
                            Gjahr: documento.Gjahr
                        })),
                        "HeaderFilesNav": adjuntos.map(file => ({
                            "File_name": file.File_name,
                            "File_cont": file.File_cont
                        }))
                    }

                    this.ZSERV_PPL_CREAFLUJO_SRV.create("/HeaderSet", body, {
                        headers: {
                            "Content-Type": "application/json;charset=utf-8"
                        },
                        success: function (response) {
                            console.log(response)
                            MessageToast.show("Flujo de requisición creado con exito.");
                            oView.setBusy(false);
                            that.onResetFields();
                        },
                        error: function (error) {
                            console.log(error)
                            MessageToast.show("Ocurrió un error al crear el flujo.");
                            oView.setBusy(false);
                        }
                    });
                }
            },

            onSociedadChange: function (oEvent) {
                const that = this;
                const oSelectedItem = oEvent.getSource().getSelectedItem().getBindingContext("Sociedades").getObject();
                const value = oEvent.getSource().getSelectedKey();
                this.cboxFlujo.setSelectedKey(oSelectedItem["Id_flow"]);
                this.onFilterAprobadores(oSelectedItem["Id_flow"])

                const aFilter = [
                    new Filter("Campo", FilterOperator.EQ, '3'),
                    new Filter("Sociedad", FilterOperator.EQ, value)
                ];

                this.ZSERV_PPL_SHELP_SRV.read("/InputHelpSet", {
                    filters: aFilter,
                    urlParameters: {
                        "format": "json",
                        "$expand": "VALNAV"
                    },
                    success: function (oData) {
                        console.log(oData)
                        that.oAcreedores.setData(oData["results"][0]["VALNAV"]["results"]);
                    },
                    error: function (oError) {
                        console.log(oError)
                        that.oAcreedores.setData([]);
                    }
                });
            },

            onResetFields: function () {
                this.inptReqId.setValue(null);
                this.cboxFlujo.setSelectedKey(null);
                this.cboxSociedad.setSelectedKey(null);
                this.txtAObservaciones.setValue(null);
                this.rbgMetodoPago.setSelectedIndex(0);
                this.inptImporte.setValue(null);
                this.cboxMoneda.setSelectedKey(null);
                this.inptConcepto.setValue(null);
                this.cboxAcreedor.setValue(null);
                this.inptCorreo.setValue(null);
                this.oAdjuntos.setData([]);
                this.oDocumentos.setData([]);
                this.oAprobadores.setData([]);
            },

            onImprimirRequisicion: function () {
                const requisicion = this.inptReqId.getValue();
                const flujo = this.cboxFlujo.getSelectedKey();
                const sociedad = this.cboxSociedad.getSelectedKey();
                const acreedor = this.cboxAcreedor.getValue();
                const moneda = this.cboxMoneda.getSelectedKey();
                const concepto = this.inptConcepto.getValue();
                const correo = this.inptCorreo.getValue();
                const importe = this.inptImporte.getValue().replace("$", "").replace(",", "");
                const comentarios = this.txtAObservaciones.getValue();
                const metodoPago = this.rbgMetodoPago.getSelectedIndex() + 1;

                let body = {
                    "FlujoId": flujo,
                    "ReqId": requisicion,
                    "Sociedad": sociedad,
                    "Proveedor": acreedor,
                    "Moneda": moneda,
                    "Concepto": concepto,
                    "Correo": correo,
                    "Importe": importe,
                    "MetodoP": metodoPago.toString(),
                    "Observaciones": comentarios
                }

                this.ZSERV_PPL_PRINT_SRV.create("/DataprintSet", body, {
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    },
                    success: function (response) {
                        console.log(response)
                        MessageToast.show("Se envió a imprimir la requisición.");
                    },
                    error: function (error) {
                        console.log(error)
                        MessageToast.show("Ocurrió un error al imprimir.");
                    }
                });
            },

            onAcreedoresHelpRequest: function () {
                const oView = this.getView();
                const sSociedad = this.byId("cboxSociedad").getSelectedKey();

                if (!sSociedad) {
                    sap.m.MessageToast.show("Seleccione una sociedad");
                    return;
                }

                if (!this._oAcreedoresVH) {
                    this._oAcreedoresVH = sap.ui.xmlfragment(
                        oView.getId(),
                        "zfiflujoaprobacion.view.fragment.AcreedoresValueHelp",
                        this
                    );
                    oView.addDependent(this._oAcreedoresVH);
                }

                const oBinding = this._oAcreedoresVH.getBinding("items");

                const aFilters = [
                    new sap.ui.model.Filter("Campo", sap.ui.model.FilterOperator.EQ, "3"),
                    new sap.ui.model.Filter("Sociedad", sap.ui.model.FilterOperator.EQ, sSociedad)
                ];

                if (oBinding) {
                    oBinding.filter(aFilters);
                }

                this._oAcreedoresVH.open();
            },

            onAcreedorSearch: function (oEvent) {

                const sQuery = oEvent.getParameter("value");
                const sSociedad = this.byId("cboxSociedad").getSelectedKey();

                const oBinding = oEvent.getSource().getBinding("items");

                // filtros base (AND)
                const aBaseFilters = [
                    new sap.ui.model.Filter("Campo", sap.ui.model.FilterOperator.EQ, "3"),
                    new sap.ui.model.Filter("Sociedad", sap.ui.model.FilterOperator.EQ, sSociedad)
                ];

                // filtro de búsqueda (OR)
                let oSearchFilter = null;

                if (sQuery) {

                    const aSearchFilters = [
                        new sap.ui.model.Filter("Valor", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, sQuery)
                    ];

                    oSearchFilter = new sap.ui.model.Filter({
                        filters: aSearchFilters,
                        and: false
                    });
                }

                // combinación final
                const aFilters = [...aBaseFilters];

                if (oSearchFilter) {
                    aFilters.push(oSearchFilter);
                }

                oBinding.filter(aFilters);
            },

            onAcreedorConfirm: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("selectedItem");
                if (!oSelectedItem) return;

                this.byId("cboxAcreedor").setValue(oSelectedItem.getTitle());
            },

            onAcreedorConfirm: function (oEvent) {

                const oItem = oEvent.getParameter("selectedItem");
                if (!oItem) return;

                const sValor = oItem.getTitle();

                this.byId("cboxAcreedor").setValue(sValor);
            },

            _onValidateUser: function () {
                return new Promise((resolve) => {
                    this.ZSERV_PPL_CHECKUSR_SRV.read(`/IDSet('${this.sUserId}')`, {
                        urlParameters: { format: "json" },
                        success: (oData) => resolve(oData.Crea === "X"),
                        error: () => resolve(false)
                    });
                });
            }
        });
    });
