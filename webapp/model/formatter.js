sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
	"use strict";
	return {
        formatDateSAP: function (inputDate) {
            console.log("Fecha de entrada:", inputDate);
            let date;
        
            if (inputDate.length === 10 && inputDate.includes('-')) {
                let [year, month, day] = inputDate.split('-');
                date = new Date(Date.UTC(year, month - 1, day));
            } else if (inputDate.length === 8 && !inputDate.includes('-')) {
                let year = inputDate.slice(0, 4);
                let month = inputDate.slice(4, 6);
                let day = inputDate.slice(6, 8);
                date = new Date(Date.UTC(year, month - 1, day));
            } else if (inputDate.includes('/') && inputDate.length <= 8) {
                let [month, day, year] = inputDate.split('/');
                year = parseInt(year, 10);
                year += (year < 50) ? 2000 : 1900;
        
                date = new Date(Date.UTC(year, month - 1, day));
            } else {
                throw new Error("Formato de fecha no válido.");
            }
        
            let dayFormatted = String(date.getUTCDate()).padStart(2, '0');
            let monthFormatted = String(date.getUTCMonth() + 1).padStart(2, '0');
            let yearFormatted = date.getUTCFullYear();
        
            const formattedDate = `${dayFormatted}.${monthFormatted}.${yearFormatted}`;
            console.log("Fecha formateada:", formattedDate);
        
            return formattedDate;
        },

        formatearFechaSAP: function(oDate) {
            if (!(oDate instanceof Date) || isNaN(oDate)) {
                return "";
            }

            const year = oDate.getFullYear();
            const month = String(oDate.getMonth() + 1).padStart(2, "0");
            const day = String(oDate.getDate()).padStart(2, "0");

            return `${year}${month}${day}`;
        }
	};
});