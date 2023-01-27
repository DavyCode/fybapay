/**
 * Transactional resource user can perform on Fybapay
 */

// "Electricity",
// "Airtime",
// "Data Subscription",
// "DSTV Subscription",
// "GOTV Subscription",
// "StarTimes Subscription",
// "Wallet2Wallet Transfer",
// "Wallet Topup",
// "Wallet Withdrawal",
// "Fund Transfer",
// "Cash Withdrawal",


exports.airvendResource = {
  DATA: { // Variation === true
    AIRTEL_DATA: {
      Service: "AIRTEL_DATA",
      serviceID: "airtel-data",
      Type: "2",
      NetworkID: "1",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    GLO_DATA: {
      Service: "GlO_DATA",
      serviceID: "glo-data",
      Type: "2",
      NetworkID: "3",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    "9MOBILE_DATA": {
      Service: "9MOBILE_DATA",
      serviceID: "9mobile-data",
      Type: "2",
      NetworkID: "4",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    MTN_DATA: {
      Service: "MTN_DATA",
      serviceID: "mtn-data",
      Type: "2",
      NetworkID: "2",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    SPECTRANET_PIN: {
      Service: "SPECTRANET_PIN",
      serviceID: 'Spectranet-pin',
      Type: "90",
      NetworkID: null,
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    SMILE_BUNDLE: {
      Service: "SMILE_BUNDLE",
      serviceID: 'Smile-bundle',
      Type: "60",
      NetworkID: null,
      Product: true,
      verify: true,
      percentageCommission: 2
    },
    SMILE_TOP: {
      Service: "SMILE_TOP",
      serviceID: "Smile-topup",
      Type: "50",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2
    }
  },
  AIRTIME: { // Variation === false
    AIRTEL_AIRTIME: {
      Service: "AIRTEL_AIRTIME",
      serviceID: "airtel-airtime",
      Type: "1",
      NetworkID: "1",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    GLO_AIRTIME: {
      Service: "GLO_AIRTIME",
      serviceID: "glo-airtime",
      Type: "1",
      NetworkID: "3",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    "9MOBILE_AIRTIME": {
      Service: "9MOBILE_AIRTIME",
      serviceID: "9mobile-airtime",
      Type: "1",
      NetworkID: "4",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    MTN_AIRTIME: {
      Service: "MTN_AIRTIME",
      serviceID: "mtn-airtime",
      Type: "1",
      NetworkID: "2",
      Product: false,
      verify: false,
      percentageCommission: 2,
    },
  },
  WAEC: { // Variation === true
    WAEC: {
      Service: "WAEC",
      serviceID: "Waec",
      Type: "80",
      NetworkID: null,
      Product: true,
      verify: false,
      percentageCommission: 2,
    }
  },
  JAMB: { // Variation === true
    JAMB_PIN: {
      Service: "JAMB_PIN",
      serviceID: "Jamb-pin",
      Type: "81",
      NetworkID: null,
      Product: true,
      verify: false,
      percentageCommission: 2,
    }
  },
  ELECTRICITY: { // Variation === false
    IKEJA_POSTPAID: {
      Service: "IKEJA_POSTPAID",
      serviceID: 'Ikeja-Postpaid',
      Type: "10",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    IKEJA_PREPAID: {
      Service: "IKEJA_PREPAID",
      serviceID: 'Ikeja-Prepaid',
      Type: "11",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    EKO_POSTPAID: {
      Service: "EKO_POSTPAID",
      serviceID: 'Eko-Postpaid',
      Type: "14",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    EKO_PREPAID: {
      Service: "EKO_PREPAID",
      serviceID: 'Eko-Prepaid',
      Type: "13",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    EEDC_POSTPAID: {
      Service: "EEDC_POSTPAID",
      serviceID: 'EEDC-Enugu-Postpaid',
      Type: "22",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    EEDC_PREPAID: {
      Service: "EEDC_PREPAID",
      serviceID: 'EEDC-Enugu-Prepaid',
      Type: "21",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    AEDC_POSTPAID: {
      Service: "AEDC_POSTPAID",
      serviceID: 'AEDC-Postpaid',
      Type: "", // todo: n/a
      NetworkID: "",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    AEDC_PREPAID: {
      Service: "AEDC_PREPAID",
      serviceID: 'AEDC-Prepaid',
      Type: "24",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    IBEDC_PREPAID: {
      Service: "IBEDC_PREPAID",
      serviceID: 'IBEDC-Ibadan-Prepaid',
      Type: "12",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    IBEDC_POSTPAID: {
      Service: "IBEDC_POSTPAID",
      serviceID: 'IBEDC-Ibadan-Postpaid',
      Type: "", //todo: n/a
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    PHED_PREPAID: {
      Service: "PHED_PREPAID",
      serviceID: 'PHED-Portharcourt-Prepaid',
      Type: "", //todo: n/a
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    PHED_POSTPAID: {
      Service: "PHED_POSTPAID",
      serviceID: 'PHED-Portharcourt-Postpaid',
      Type: "15",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    KEDCO_PREPAID: {
      //todo: n/a
      Service: "KEDCO_PREPAID",
      serviceID: 'KEDCO-Kaduna-Prepaid',
      Type: "",
      NetworkID: "",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    KEDCO_POSTPAID: {
      //todo: n/a
      Service: "KEDCO_POSTPAID",
      serviceID: 'KEDCO-Kaduna-Postpaid',
      Type: "",
      NetworkID: "",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    }
  },
  CABLETV: { // Variation === true
    DSTV: {
      Service: "DSTV",
      serviceID: 'Dstv',
      Type: "30",
      NetworkID: null,
      Product: true,
      verify: true,
      percentageCommission: 2,
    },
    GOTV: {
      Service: "GOTV",
      serviceID: 'Gotv',
      Type: "40",
      NetworkID: null,
      Product: true,
      verify: true,
      percentageCommission: 2,
    },
    STARTIMES: {
      Service: "STARTIMES",
      serviceID: 'Startimes',
      Type: "70",
      NetworkID: null,
      Product: false,
      verify: true,
      percentageCommission: 2,
    }
  }
};

exports.primeAirtimeServices = {
  AIRTIME: { // Variation === false
    AIRTEL_AIRTIME: {
      Service: "AIRTEL_AIRTIME",
      serviceID: "airtel-airtime",
      sku: "MFIN-1-OR",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    GLO_AIRTIME: {
      Service: "GLO_AIRTIME",
      serviceID: "glo-airtime",
      sku: "MFIN-6-OR",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    "9MOBILE_AIRTIME": {
      Service: "9MOBILE_AIRTIME",
      serviceID: "9mobile-airtime",
      sku: "MFIN-2-OR",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    MTN_AIRTIME: {
      Service: "MTN_AIRTIME",
      serviceID: "mtn-airtime",
      sku: "MFIN-5-OR",
      Product: false,
      verify: false,
      percentageCommission: 2,
    }
  },
  DATA: { // Variation === true
    AIRTEL_DATA: {
      Service: "AIRTEL_DATA",
      serviceID: "airtel-data",
      msisdn: "2349022222222",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    GLO_DATA: {
      Service: "GlO_DATA",
      serviceID: "glo-data",
      msisdn: "2348052539535",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    "9MOBILE_DATA": {
      Service: "9MOBILE_DATA",
      serviceID: "9mobile-data",
      msisdn: "2348091122334",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    MTN_DATA: {
      Service: "MTN_DATA",
      serviceID: "mtn-data",
      msisdn: "2348132078657",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    SPECTRANET_PIN: {
      Service: "SPECTRANET_PIN",
      serviceID: 'Spectranet-pin',
      msisdn: "BPI-NGCA-BGA",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    SMILE_BUNDLE: {
      Service: "SMILE_BUNDLE",
      serviceID: 'Smile-bundle',
      msisdn: "BPI-NGCA-ANB",
      Product: true,
      verify: true,
      percentageCommission: 2
    },
    SMILE_TOP: {
      Service: "SMILE_TOP",
      serviceID: "Smile-topup",
      msisdn: "BPI-NGCA-ANA",
      Product: false,
      verify: true,
      percentageCommission: 2
    }
  },
  CABLETV: {
    DSTV: {
      Service: "DSTV",
      serviceID: 'Dstv',
      sku: "BPD-NGCA-AQA",
      Product: true,
      verify: true,
      percentageCommission: 2,
    },    
    GOTV: {
      Service: "GOTV",
      serviceID: 'Gotv',
      sku: "BPD-NGCA-AQC",
      Product: true,
      verify: true,
      percentageCommission: 2,
    },
    STARTIMES: {
      Service: "STARTIMES",
      serviceID: 'Startimes',
      sku: "BPD-NGCA-AWA",
      Product: false,
      verify: true,
      percentageCommission: 2,
    }
  },
  ELECTRICITY: {
    // "name": "Eko PHCN",
    // "name": "Ikeja Electric",
    // "name": "Ibadan Distribution",
    // "name": "Enugu Distribution",
    // "name": "Port Harcourt Prepaid",
    // "name": "Port Harcourt Postpaid",
    // "name": "Kano Prepaid",
    // "name": "Kano Postpaid",
    // "name": "Abuja Prepaid",
    // "name": "Abuja Postpaid",
    EKO_PREPAID: {
      Service: "EKO_PREPAID",
      serviceID: 'Eko-Prepaid',
      sku: "BPE-NGEK-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    IKEJA_PREPAID: {
      Service: "IKEJA_PREPAID",
      serviceID: 'Ikeja-Prepaid',
      sku: "BPE-NGIE-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    IBEDC_PREPAID: {
      Service: "IBEDC_PREPAID",
      serviceID: 'IBEDC-Ibadan-Prepaid',
      sku: "BPE-NGIB-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    EEDC_PREPAID: {
      Service: "EEDC_PREPAID",
      serviceID: 'EEDC-Enugu-Prepaid',
      sku: "BPE-NGEN-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    PHED_PREPAID: {
      Service: "PHED_PREPAID",
      serviceID: 'PHED-Portharcourt-Prepaid',
      sku: "BPE-NGCABIA-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    PHED_POSTPAID: {
      Service: "PHED_POSTPAID",
      serviceID: 'PHED-Portharcourt-Postpaid',
      sku: "BPE-NGCABIB-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    KANO_PREPAID: {
      Service: "KANO_PREPAID",
      serviceID: 'Kano-Prepaid',
      sku: "BPE-NGCAAVB-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    KANO_POSTPAID: {
      Service: "KANO_POSTPAID",
      serviceID: 'Kano-Postpaid',
      sku: "BPE-NGCAAVC-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    AEDC_POSTPAID: {
      Service: "AEDC_POSTPAID",
      serviceID: 'AEDC-Postpaid',
      sku: "BPE-NGCABABB-OR", 
      Product: false,
      verify: "",
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    AEDC_PREPAID: {
      Service: "AEDC_PREPAID",
      serviceID: 'AEDC-Prepaid',
      sku: "BPE-NGCABABA-OR",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },

  },
  WAEC: { // Variation === true
    WAEC: {
      Service: "WAEC",
      serviceID: "Waec",
      sku: "BPM-NGCA-ASA",
      Product: true,
      verify: false,
      percentageCommission: 2,
    }
  },
  JAMB: { // Variation === true
    JAMB_PIN: {
      Service: "JAMB_PIN",
      serviceID: "Jamb-pin",
      sku: "BPM-NGXP-JAMB",
      Product: true,
      verify: false,
      percentageCommission: 2,
    }
  },
};

exports.vtpassServices = {
  AIRTIME: {
    AIRTEL_AIRTIME: {
      Service: "AIRTEL_AIRTIME",
      serviceID: "airtel-airtime",
      sku: "airtel",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    GLO_AIRTIME: {
      Service: "GLO_AIRTIME",
      serviceID: "glo-airtime",
      sku: "glo",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    "9MOBILE_AIRTIME": {
      Service: "9MOBILE_AIRTIME",
      serviceID: "9mobile-airtime",
      sku: "etisalat",
      Product: false,
      verify: false,
      percentageCommission: 2
    },
    MTN_AIRTIME: {
      Service: "MTN_AIRTIME",
      serviceID: "mtn-airtime",
      sku: "mtn",
      Product: false,
      verify: false,
      percentageCommission: 2,
    }
  },
  DATA: {
    AIRTEL_DATA: {
      Service: "AIRTEL_DATA",
      serviceID: "airtel-data",
      sku: "airtel-data",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    GLO_DATA: {
      Service: "GlO_DATA",
      serviceID: "glo-data",
      sku: "glo-data",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    "9MOBILE_DATA": {
      Service: "9MOBILE_DATA",
      serviceID: "9mobile-data",
      sku: "etisalat-data",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    MTN_DATA: {
      Service: "MTN_DATA",
      serviceID: "mtn-data",
      sku: "mtn-data",
      Product: true,
      verify: false,
      percentageCommission: 2
    },
    SMILE_BUNDLE: {
      Service: "SMILE_BUNDLE",
      serviceID: 'Smile-bundle',
      sku: "smile-direct",
      Product: true,
      verify: true,
      percentageCommission: 2
    },
  },
  CABLETV: {
    DSTV: {
      Service: "DSTV",
      serviceID: 'Dstv',
      sku: "dstv",
      Product: true,
      verify: true,
      percentageCommission: 2,
    },    
    GOTV: {
      Service: "GOTV",
      serviceID: 'Gotv',
      sku: "gotv",
      Product: true,
      verify: true,
      percentageCommission: 2,
    },
    STARTIMES: {
      Service: "STARTIMES",
      serviceID: 'Startimes',
      sku: "startimes",
      Product: false,
      verify: true,
      percentageCommission: 2,
    }
  },
  ELECTRICITY: {
    // "serviceID": "ikeja-electric",
    // "serviceID": "eko-electric",
    // "serviceID": "kano-electric",
    // "serviceID": "portharcourt-electric",
    // "serviceID": "jos-electric",
    // "serviceID": "ibadan-electric",

    EKO_PREPAID: {
      Service: "EKO_PREPAID",
      serviceID: 'Eko-Prepaid',
      sku: "eko-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    EKO_POSTPAID: {
      Service: "EKO_POSTPAID",
      serviceID: 'Eko-Postpaid',
      sku: "eko-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    IKEJA_PREPAID: {
      Service: "IKEJA_PREPAID",
      serviceID: 'Ikeja-Prepaid',
      sku: "ikeja-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    IKEJA_POSTPAID: {
      Service: "IKEJA_POSTPAID",
      serviceID: 'Ikeja-Postpaid',
      sku: "ikeja-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    KANO_PREPAID: {
      Service: "KANO_PREPAID",
      serviceID: 'Kano-Prepaid',
      sku: "kano-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    KANO_POSTPAID: {
      Service: "KANO_POSTPAID",
      serviceID: 'Kano-Postpaid',
      sku: "kano-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    PHED_PREPAID: {
      Service: "PHED_PREPAID",
      serviceID: 'PHED-Portharcourt-Prepaid',
      sku: "portharcourt-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    PHED_POSTPAID: {
      Service: "PHED_POSTPAID",
      serviceID: 'PHED-Portharcourt-Postpaid',
      sku: "portharcourt-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    JOS_PREPAID: {
      Service: "JOS_PREPAID",
      serviceID: 'Jos-Prepaid',
      sku: "jos-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    JOS_POSTPAID: {
      Service: "JOS_POSTPAID",
      serviceID: 'Jos-Postpaid',
      sku: "jos-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
    IBEDC_PREPAID: {
      Service: "IBEDC_PREPAID",
      serviceID: 'IBEDC-Ibadan-Prepaid',
      sku: "ibadan-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "prepaid"
    },
    IBEDC_POSTPAID: {
      Service: "IBEDC_POSTPAID",
      serviceID: 'IBEDC-Ibadan-Postpaid',
      sku: "ibadan-electric",
      Product: false,
      verify: true,
      percentageCommission: 2,
      serviceType: "postpaid"
    },
  },
  // WAEC: {},
  // JAMB: {},
  // OTHERS: {}
}


























const vendorServices = {
  CABLETV: { // PRODUCTS
    DSTV: {
      Service: "DSTV",
      Type: "30",
      NetworkID: null,
      Product: true,
      verify: true,
      ProductList: [
        {
            "description": " ",
            "Amount": 2000,
            "code": "ACSSE36",
            "name": "DStv Access"
        },
        {
            "description": " ",
            "Amount": 4000,
            "code": "COFAME36",
            "name": "DStv Family"
        },
        {
            "description": " ",
            "Amount": 6800,
            "code": "COMPE36",
            "name": "DStv Compact"
        },
        {
            "description": " ",
            "Amount": 10650,
            "code": "COMPLE36",
            "name": "DStv Compact Plus"
        },
        {
            "description": " ",
            "Amount": 15800,
            "code": "PRWE36",
            "name": "DStv Premium"
        },
        {
            "description": " ",
            "Amount": 17700,
            "code": "PRWASIE36",
            "name": "DStv Premium Asia"
        },
        {
            "description": " ",
            "Amount": 5400,
            "code": "ASIAE36",
            "name": "Asian Bouqet"
        },
        {
            "description": " ",
            "Amount": 1600,
            "code": "FTAE36",
            "name": "DStv FTA Plus"
        },
        {
            "description": " ",
            "Amount": 2500,
            "code": "NNJ1E36",
            "name": "DStv Yanga Bouquet E36"
        },
        {
            "description": " ",
            "Amount": 4500,
            "code": "NNJ2E36",
            "name": "DStv Confam Bouquet E36"
        }
      ]
    },
    GOTV: {
      Service: "GOTV",
      Type: "40",
      NetworkID: null,
      Product: true,
      verify: true,
      ProductList: [
        {
            "descrition": " ",
            "Amount": 1250,
            "code": "GOTV",
            "name": "GOtv Value"
        },
        {
            "descrition": " ",
            "Amount": 1900,
            "code": "GOTVPLS",
            "name": "GOtv Plus"
        },
        {
            "descrition": " ",
            "Amount": 3200,
            "code": "GOtvMax",
            "name": "GOtv Max"
        },
        {
            "descrition": " ",
            "Amount": 400,
            "code": "GOHAN",
            "name": "GOtv Lite Monthly"
        },
        {
            "descrition": " ",
            "Amount": 1050,
            "code": "GOLITE",
            "name": "GOtv Lite Quarterly"
        },
        {
            "descrition": " ",
            "Amount": 1600,
            "code": "GOTVNJ1",
            "name": "GOtv Jinja Bouquet"
        },
        {
            "descrition": " ",
            "Amount": 2400,
            "code": "GOTVNJ2",
            "name": "GOtv Jolli Bouquet"
        }
      ]
    },
    STARTIMES: {
      Service: "STARTIMES",
      Type: "70",
      NetworkID: null,
      Product: false,
      verify: false,
      ProductList: []
    }
  },
  ELECTRICITY: { // NO PRODUCTS
    IKEJA_POSTPAID: {
      Service: "IKEJA POSTPAID",
      Type: "10",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "postpaid"
    },
    IKEJA_PREPAID: {
      Service: "IKEJA PREPAID",
      Type: "11",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "prepaid"
    },
    EKO_POSTPAID: {
      Service: "EKO POSTPAID",
      Type: "14",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "postpaid"
    },
    EKO_PREPAID: {
      Service: "EKO PREPAID",
      Type: "13",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "prepaid"
    },
    EEDC_POSTPAID: {
      Service: "EEDC POSTPAID",
      Type: "22",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "postpaid"
    },
    EEDC_PREPAID: {
      Service: "EEDC PREPAID",
      Type: "21",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "prepaid"
    },
    AEDC_POSTPAID: {
      Service: "AEDC POSTPAID",
      Type: "", // todo: n/a
      NetworkID: "",
      Product: "",
      verify: "",
      serviceType: "postpaid"
    },
    AEDC_PREPAID: {
      Service: "AEDC PREPAID",
      Type: "24",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "prepaid"
    },
    IBEDC_PREPAID: {
      Service: "IBADAN PREPAID(IBEDC)",
      Type: "12",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "prepaid"
    },
    IBEDC_POSTPAID: {
      Service: "IBADAN POSTPAID(IBEDC)",
      Type: "", //todo: n/a
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "postpaid"
    },
    PHED_PREPAID: {
      Service: "PHED PREPAID",
      Type: "", //todo: n/a
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "prepaid"
    },
    PHED_POSTPAID: {
      Service: "PHED POSTPAID",
      Type: "15",
      NetworkID: null,
      Product: false,
      verify: true,
      serviceType: "postpaid"
    },
    KEDCO_PREPAID: {
      //todo: n/a
      Service: "KEDCO PREPAID",
      Type: "",
      NetworkID: "",
      Product: "",
      verify: "",
      serviceType: "prepaid"
    },
    KEDCO_POSTPAID: {
      //todo: n/a
      Service: "KEDCO POSTPAID",
      Type: "",
      NetworkID: "",
      Product: "",
      verify: "",
      serviceType: "postpaid"
    }
  },
  DATA: { // PRODUCTS
    AIRTEL: {
      Service: "AIRTEL DATA",
      Type: "2",
      NetworkID: "1",
      Product: true, //True for Service that you can call for its product
      verify: false,
      ProductList: [
        {
            "description": "20MB + 10% Extra",
            "Amount": "50",
            "code": "49.99",
            "validity": "1Day"
        },
        {
            "description": "75MB + 10% Extra",
            "Amount": "100",
            "code": "99",
            "validity": "1Day"
        },
        {
            "description": "200MB + 10% Extra",
            "Amount": "199",
            "code": "199.03",
            "validity": "3Days"
        },
        {
            "description": "350MB + 10% Extra",
            "Amount": "299",
            "code": "299.02",
            "validity": "7Days"
        },
        {
            "description": "750MB + 10% Extra",
            "Amount": "500",
            "code": "499",
            "validity": "14Days"
        },
        {
            "description": "1.5GB + 10% Extra",
            "Amount": "1000",
            "code": "999",
            "validity": "30Days"
        },
        {
            "description": "(3.5GB)2.5GB+1GB(1AM-7AM) + 10",
            "Amount": "1500",
            "code": "1499.01",
            "validity": "30Days"
        },
        {
            "description": "(3.5GB)  + 10% Extra",
            "Amount": "2000",
            "code": "1999",
            "validity": "30Days"
        },
        {
            "description": "5.5GB 4.5GB+1GB(1AM-7AM)+ 10% ",
            "Amount": "2500",
            "code": "2499.01",
            "validity": "30Days"
        },
        {
            "description": "6.5GB 5.5GB+1GB(1AM-7AM)  + 10",
            "Amount": "3000",
            "code": "2999.02",
            "validity": "30Days"
        },
        {
            "description": "(9.5GB)7.5GB+2GB(1AM-7AM)  + 1",
            "Amount": "4000",
            "code": "3999.01",
            "validity": "30Days"
        },
        {
            "description": "(12GB)10GB+2GB(1AM-7AM)  + 10%",
            "Amount": "5000",
            "code": "4999",
            "validity": "30Days"
        },
        {
            "description": "25GB + 10% Extra",
            "Amount": "10000",
            "code": "9999",
            "validity": "30Days"
        },
        {
            "description": "40GB + 10% Extra",
            "Amount": "15000",
            "code": "14999",
            "validity": "30Days"
        },
        {
            "description": "60GB + 10% Extra",
            "Amount": "20000",
            "code": "19999.02",
            "validity": "30Days"
        }
      ]
    },
    GLO: {
      Service: "GlO DATA",
      Type: "2",
      NetworkID: "3",
      Product: true,
      verify: false,
      ProductList: [
        {
            "description": "12.5MB",
            "Amount": "25",
            "code": "25",
            "validity": "1Day"
        },
        {
            "description": "27.5MB",
            "Amount": "50",
            "code": "50",
            "validity": "1Day"
        },
        {
            "description": "92MB",
            "Amount": "100",
            "code": "100",
            "validity": "2Days"
        },
        {
            "description": "242MB",
            "Amount": "200",
            "code": "200",
            "validity": "4Days"
        },
        {
            "description": "920MB",
            "Amount": "500",
            "code": "500",
            "validity": "14Days"
        },
        {
            "description": "1.8GB",
            "Amount": "1000",
            "code": "1000",
            "validity": "30Days"
        },
        {
            "description": "4.5GBB",
            "Amount": "2000",
            "code": "2000",
            "validity": "30Days"
        },
        {
            "description": "7.2GB",
            "Amount": "2500",
            "code": "2500",
            "validity": "30Days"
        },
        {
            "description": "8.75GB",
            "Amount": "3000",
            "code": "3000",
            "validity": "30Days"
        },
        {
            "description": "12.5",
            "Amount": "4000",
            "code": "4000",
            "validity": "30Days"
        },
        {
            "description": "15.6GB",
            "Amount": "5000",
            "code": "5000",
            "validity": "30Days"
        },
        {
            "description": "25GB",
            "Amount": "8000",
            "code": "8000",
            "validity": "30Days"
        },
        {
            "description": "32.5GB",
            "Amount": "10000",
            "code": "10000",
            "validity": "30Days"
        },
        {
            "description": "52.5GB",
            "Amount": "15000",
            "code": "15000",
            "validity": "30Days"
        },
        {
            "description": "62.5GB",
            "Amount": "18000",
            "code": "18000",
            "validity": "30Days"
        },
        {
            "description": "78.7GB",
            "Amount": "20000",
            "code": "20000",
            "validity": "30Days"
        }
      ]
    },
    "9MOBILE": {
      Service: "9MOBILE DATA",
      Type: "2",
      NetworkID: "4",
      Product: true,
      verify: false,
      ProductList: [
        {
            "description": "40MB",
            "Amount": "100",
            "code": "100",
            "validity": "1Day"
        },
        {
            "description": "150MB",
            "Amount": "200",
            "code": "200",
            "validity": "7Days"
        },
        {
            "description": "500MB",
            "Amount": "500",
            "code": "500",
            "validity": "7Days"
        },
        {
            "description": "1GB",
            "Amount": "1000",
            "code": "1000",
            "validity": "30Days"
        },
        {
            "description": "1.5GB",
            "Amount": "1200",
            "code": "1200",
            "validity": "30Days"
        },
        {
            "description": "2.5GB",
            "Amount": "2000",
            "code": "2000",
            "validity": "30Days"
        },
        {
            "description": "3.5GB",
            "Amount": "2500",
            "code": "2500",
            "validity": "30Days"
        },
        {
            "description": "5GB",
            "Amount": "3500",
            "code": "3500",
            "validity": "30Days"
        },
        {
            "description": "11GB",
            "Amount": "8000",
            "code": "8000",
            "validity": "30Days"
        },
        {
            "description": "15GB",
            "Amount": "10000",
            "code": "10000",
            "validity": "30Days"
        },
        {
            "description": "27.5GB",
            "Amount": "18000",
            "code": "18000",
            "validity": "90Days"
        },
        {
            "description": "30GB",
            "Amount": "27500",
            "code": "27500",
            "validity": "90Days"
        },
        {
            "description": "60GB",
            "Amount": "55000",
            "code": "55000",
            "validity": "180Days"
        },
        {
            "description": "100GB",
            "Amount": "84992",
            "code": "84992",
            "validity": "100Days"
        },
        {
            "description": "120GB",
            "Amount": "110000",
            "code": "110000",
            "validity": "365Days"
        }
      ]
    },
    MTN: {
      Service: "MTN DATA",
      Type: "2",
      NetworkID: "2",
      Product: true,
      verify: false,
      ProductList: [
        {
            "description": "50MB",
            "Amount": "100",
            "code": "100",
            "validity": "1Day"
        },
        {
            "description": "100MB",
            "Amount": "200",
            "code": "200",
            "validity": "1Day"
        },
        {
            "description": "750MB",
            "Amount": "500",
            "code": "500",
            "validity": "7Days"
        },
        {
            "description": "1GB",
            "Amount": "1000",
            "code": "1000",
            "validity": "30Days"
        },
        {
            "description": "3GB",
            "Amount": "1500",
            "code": "1500",
            "validity": "30Days"
        },
        {
            "description": "3.5GB",
            "Amount": "2000",
            "code": "2000",
            "validity": "30Days"
        },
        {
            "description": "10GB",
            "Amount": "5000",
            "code": "5000",
            "validity": "30Days"
        },
        {
            "description": "15GB",
            "Amount": "6000",
            "code": "6000",
            "validity": "30Days"
        },
        {
            "description": "22GB",
            "Amount": "10000",
            "code": "10000",
            "validity": "30Days"
        },
        {
            "description": "100GB",
            "Amount": "30000",
            "code": "30000",
            "validity": "30Days"
        },
        {
            "description": "300Hours",
            "Amount": "13000",
            "code": "13000",
            "validity": "300Hours"
        }
      ]
    },
    SPECTRANET: {
      Service: "SPECTRANET(PIN)",
      Type: "90",
      NetworkID: null,
      Product: true,
      verify: false,
      ProductList: [
        {
            "descrition": "PIN Purchase of 500",
            "Amount": 500,
            "code": "406",
            "Validity": ""
        },
        {
            "descrition": "PIN Purchase of 1000",
            "Amount": 1000,
            "code": "63",
            "Validity": ""
        },
        {
            "descrition": "PIN Purchase of 2000",
            "Amount": 2000,
            "code": "88",
            "Validity": ""
        },
        {
            "descrition": "PIN Purchase of 5000",
            "Amount": 5000,
            "code": "144",
            "Validity": ""
        },
        {
            "descrition": "PIN Purchase of 7000",
            "Amount": 7000,
            "code": "45",
            "Validity": ""
        },
        {
            "descrition": "PIN Purchase of 10000",
            "Amount": 10000,
            "code": "31",
            "Validity": ""
        }
      ]
    },
    SMILE_BUNDLE: {
      Service: "SMILE BUNDLE",
      Type: "60",
      NetworkID: null,
      Product: true,
      verify: true,
      ProductList: []
    },
    SMILE_TOPUP: {
      Service: "SMILE TOPUP",
      Type: "50",
      NetworkID: null,
      Product: false,
      verify: true,
      ProductList: []
    }
  },
  AIRTIME: { // NO PRODUCTS
    AIRTEL: {
      Service: "AIRTEL RECHARGE",
      Type: "1",
      NetworkID: "1",
      Product: null,
      verify: false
    },
    GLO: {
      Service: "GLO RECHARGE",
      Type: "1",
      NetworkID: "3",
      Product: false,
      verify: false
    },
    "9MOBILE": {
      Service: "9MOBILE RECHARGE",
      Type: "1",
      NetworkID: "4",
      Product: false,
      verify: false
    },
    MTN: {
      Service: "MTN RECHARGE",
      Type: "1",
      NetworkID: "2",
      Product: false,
      verify: false
    }
  },
  OTHERS: { // PRODUCTS
    WAEC: {
      Service: "WAEC",
      Type: "80",
      NetworkID: null,
      Product: true,
      verify: false,
      ProductList: [
        {
          "amount": 800,
          "code": 1092
        }
      ]
    },
    JAMB: {
      Service: "JAMB PIN",
      Type: "81",
      NetworkID: null,
      Product: true,
      verify: false,
      ProductList: [
        {
          "name": "UTME PIN",
          "amount": 4000,
          "code": "UTME PIN"
        },
        {
          "name": "Direct Entry (DE)",
          "amount": 4000,
          "code": "Direct Entry (DE)"
        }
      ]
    }
  }
};

// exports.transactionServices = {
//   WALLET: {
//     W2W: {
//       Service: "W2W TRANSFER"
//     },
//     TOPUP: {
//       Service: "WALLET TOPUP"
//     },
//     CASHOUT: {
//       Service: "WALLET CASHOUT"
//     }
//   },
//   FUND: {
//     TRANSFER: {
//       Service: "FUND TRANSFER"
//     },
//     WITHDRAWAL: {
//       Service: "FUND WITHDRAWAL"
//     }
//   },
//   POS: {
//     TRANSFER: {
//       Service: "POS TRANSFER"
//     },
//     WITHDRAWAL: {
//       Service: "POS WITHDRAWAL"
//     }
//   }
// };


// private String userId;
// private double amount;
// private String phoneNumber;
// private String serviceID;
// private String variationCode;
// private String billersCode;