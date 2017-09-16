rush = window.rush = {

    "passcode": "",
    "address": "",
    "txSec": "",
    "balance": 0,
    "txUnspent": "",
    "txValue": 0,
    "txFee": 0.0001,
    "txAmount": .001,
    "txDest": "",
    "counter": 0,
    "encrypted": false,
    "gpgPrivate": "",
    "gpgPublic": "",
    "gpgKeys": Array(),
    "gpgPage": Array(),
    "price": 0,
    "useFiat": false,
    "useFiat2": false,
    "firstTime":false,
    "currency": "USD",
    "currencyOptions": ["CNY","EUR","GBP","JPY","RUB","USD"],
    "sweeping":"",
    "getBalanceBlock": false,
    "chartLoaded": false,

    "open": function ()
    {
        $("#settings").show();

        if ( readCookie("currency") != "" )
        {
            this.currency = readCookie("currency");
        }

        if ( readCookie("txFee") != "" )
        {
            this.txFee = readCookie("txFee");
        }

        //is invoice wallet?
        invoices = localStorage.invoices;

        if ( invoices && invoices != '[]' )
        {

            invoices = JSON.parse( invoices );

            for ( i in invoices )
            {
                if ( invoices[i].address == this.address )
                {
                    $("#walletName").html( invoices[i].title );
                    break;
                }
            }
        }

        //

        $("#wallet, #txList").show();
        $("#generate").hide();

        $("#address").html(this.address);

        $(".qrimage").attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=groestlcoin%3A" + this.address + "&chld=H|0")

        rush.getBalance();

        // TODO.. NEED TO IMPLEMENT OWN WEB SOCKET

        /*
        var socket = new WebSocket("wss://ws.blockchain.info/inv");

        socket.onopen = function (msg)
        {
            var message = {
                "op": 'addr_sub',
                "addr": rush.address
            };


            socket.send(JSON.stringify(message));
        }

        socket.onmessage = function (msg)
        {
            setTimeout(function ()
            {
                if ( !rush.getBalanceBlock )
                {
                    rush.getBalance();
                    playBeep();
                }

            }, 500);
        }*/


        /*function rushWalletPublicSocket(){

            var self = this;
            self.events = { };
            var wspath = window.location.href;
            wspath = wspath.substring(0, wspath.lastIndexOf("/"));
            //console.log(wspath)
            var message = {
                "op": 'addr_sub',
                "addr": rush.address
            };
            self.socket = io.connect(wspath+'/pub-soc');
            self.socket.on('connect', function() {
                self.dispatch(message, function(){
                    //console.log("subscribed...")
                })
            })    
            self.socket.on('error', function() { })
            self.socket.on('disconnect', function() { })
            self.socket.on('message', function(args) {                     

                if(args.op == "balance") {
                    rush.getBalance();
                    playBeep();
                }

            })

            self.dispatch = function(msg, callback) {
              return self.socket.emit('message', msg, callback);
            }
            
        } 

        new rushWalletPublicSocket( );

        */

        url = "http://jswallet.groestlcoin.org/?z=" + ( Math.floor(Math.random() * 9999999) + 1 ) + "#" + rush.passcode + "&{CODE}";
        url2="zxing://scan/?ret=" + encodeURIComponent( url ) + "&SCAN_FORMATS=QR";
        $("#qrlink").attr("href", url2);


        if ( rush.firstTime )
        {
            $("#saveURLHolder, #saveURL").show();

            setTimeout( function()
            {
                $("#saveURL").slideUp();

            }, 7000);

            ga( "send", "event", "Create", "Wallet" );

        }        
        else
        {
            ga( "send", "event", "Open", "Wallet" );

        }
    

        // this.getHistory();
        
        // if ( rush.lastTab == "gpg" )
        // {
        //     setTimeout(function ()
        //     {
        //         rush.openGpgTab();
        //     }, 200);
        // }

        setInterval( function()
        {
            rush.getFiatPrice();
        }, 300000);


    },

   
    "check": function ()
    {

        if ( this.useFiat )
        {
            var amount = parseFloat($("#txtAmount").val()) / this.price;
        }
        else
        {
            var amount = $("#txtAmount").val();   
        }

        if (amount > this.balance)
        {
            setMsg("You are trying to send more GRS than you have in your balance!");
            return false;
        }
        
        // console.log( "total: " + (parseFloat(amount) + parseFloat(this.txFee)) + " balance: " + this.balance);

        total = parseFloat(amount) + parseFloat(this.txFee);

        total = btcFormat( total );

        if (total > this.balance)
        {
            setMsg("You need to leave enough room for the " + this.txFee + " grs miner fee");
            return false;
        }

        if (parseFloat(amount) <= 0)
        {
            setMsg("Please enter an amount!");

            return false;
        }

        if ( !this.checkAddress( $('#txtAddress').val() ) )
        {
            setMsg("Invalid address!");

            return false;
        }

       return true;
    },
    "checkAddress": function ( address )
    {
        try
        {
            var res = Bitcoin.base58.checkDecode(address);
            var version = res.version
            var payload = res.slice(0);
            if ( version == 36 )
                return true;
        }
        catch (err)
        {
            return false;
        }
    },
    "send": function ()
    {
        if (!this.check())
        {
            return;
        }

        if (this.encrypted)
        {

            if ($("#password").val() == "")
            {
                setMsg("Your wallet is encrypted. Please enter a password.");
            }

            var passcode = CryptoJS.AES.decrypt(this.passcode, $("#password").val());

            var passcode = passcode.toString(CryptoJS.enc.Utf8);

            if (!passcode)
            {
                setMsg("Wrong Password!");
                return;
            }

        }
        else
        {
            var passcode = this.passcode;
        }

        var bytes = Bitcoin.Crypto.SHA256(passcode,
        {
            asBytes: true
        });

        var btcKey = new Bitcoin.Key(bytes);

        this.txSec = btcKey.export("base58");
        
        if ( this.useFiat )
        {
            var btcValue = parseFloat($("#txtAmount").val()) / this.price;
            btcValue = btcFormat( btcValue );
            this.txAmount = btcValue;

        }
        else
        {
            this.txAmount = parseFloat($("#txtAmount").val());
            this.txAmount = btcFormat( this.txAmount );
        }

        this.txDest = $('#txtAddress').val();
        txGetUnspent();

        $("#sendBtn").attr("disabled", "disabled");
        $("#sendBtn").html("Sending...");
        $("#fiatPrice").hide();
    },
    "sweep": function ( code )
    {
        var bytes = Bitcoin.Crypto.SHA256(code,
        {
            asBytes: true
        });

        var btcKey = new Bitcoin.Key(bytes);
        var address = btcKey.getBitcoinAddress().toString();

        this.txSec = btcKey.export("base58");
        this.txDest = rush.address;


        var url = "getBalance/"+ this.address;


        rush.sweeping = rush.address;
        rush.address = address;


        $.ajax(
        {
            type: "GET",
            url: url,
            cache : false,
            async: true,
            data:
            {}

        }).done(function (msg)
        {

            // balance = msg / 100000000;
            fee = rush.txFee * 100000000;

            amount = msg - fee;

            if ( fee < msg )
            {
                amount = amount / 100000000;

                rush.txAmount = amount.toFixed(8);
                txGetUnspent();
                $("#sendBtn").attr("disabled", "disabled");
                $("#sendBtn").html("Sending...");
            }
            else
            {
                alert("Not enough funds to sweep!");
                rush.address = rush.sweeping;
                rush.sweeping="";
            }

            

        });
    },
    "resetInvoiceID": function ()
    {
        microtime = new Date().getTime();

        microHash = Bitcoin.Crypto.SHA256( microtime.toString() );

        invoiceID = microHash.substring(0, 10);

        $("#txtInvoiceID").val( invoiceID );
    },
    "openSmartRequestBox": function ()
    {
        $("#settingsTitle .glyphicon, #settingsInvoice").show();
        $("#youtubeLinkBox").hide();
        $("#settingsTitleText").html( "Payment Request Manager" );

        rush.resetInvoiceID();

        rush.updateInvoices( "SmartRequest" );

        $("#invoiceType").val("SmartRequest");

        $("#headerBalance").html( "Paid" );
        $("#headerAmount").html( "Requested" );


        $("#btnCreateInvoice, #btnNewRequest").html( "Create Payment Request");


    },
    "openSmartFundBox": function ()
    {
        $("#settingsTitle .glyphicon, #settingsInvoice").show();
        $("#settingsTitleText").html( "Fundraiser Manager" );
        $("#youtubeLinkBox").show();
        $("#txtYoutube").val("");


        microtime = new Date().getTime();

        microHash = Bitcoin.Crypto.SHA256( microtime.toString() );

        invoiceID = microHash.substring(0, 10);

        $("#txtInvoiceID").val( invoiceID );

        rush.updateInvoices( "SmartFund" );

        $("#invoiceType").val("SmartFund");

        $("#headerBalance").html( "Raised" );
        $("#headerAmount").html( "Goal" );

        $("#btnCreateInvoice, #btnNewRequest").html( "Create Fundraiser");

    },
    "openImportRequest": function ()
    {
        type = $("#invoiceType").val();

        $("#importRequestBox").slideDown();
        $("#settingsInvoice, #requestForm").hide();
    },
    "generate": function ()
    {

        $("#txtReceiveAmount").blur();
        $('html, body').animate({ scrollTop: 0 }, 'fast');


        setTimeout( function () {

            $("#request").modal("show");
            rush.generateNow();

        }, 1000);

       

        
    },
    "checkInvoice": function ()
    {
        if ( !rush.address )
        {
            return false;
        }

        if ( isNaN( $("#txtInvoiceAmount").val() ) || $("#txtInvoiceAmount").val() <= 0 || $("#txtInvoiceAmount").val() == "" || $("#txtInvoiceTitle").val() == "" )
        {
            return false;
        }

        if ( $("#txtInvoiceID").val() == "" )
        {
            return false;
        }

        if ( $("#txtYoutube").val() !== "" )
        {
            if ( getVideoID( $("#txtYoutube").val() ) == false )
            {
                return false;
            }
        }

        return true;
    },
    "createInvoice": function ()
    {
        if ( !this.checkInvoice() )
        {
            return false;
        }

        ga( "send", "event", "Invoice", "Create" );


        var bytes = Bitcoin.Crypto.SHA256(Bitcoin.Crypto.SHA256(this.passcode + "_" + $("#txtInvoiceID").val()) ,
        {
            asBytes: true
        });

        var btcKey = new Bitcoin.Key(bytes);
        var address = btcKey.getBitcoinAddress().toString();

        amount = parseFloat( $("#txtInvoiceAmount").val() );

        title = $("#txtInvoiceTitle").val();

        type = $("#invoiceType").val();
       
        video = $("#txtYoutube").val();

        invoice = {address:address,"amount":amount,title:title,invoiceid:$("#txtInvoiceID").val(),description:$("#txtInvoiceDescription").val(),myAddress:rush.address, type:type, video:video};

        invoices = localStorage.invoices;

        if ( !invoices )
        {
            localStorage.invoices =  JSON.stringify([invoice]);    
        }
        else
        {
            invoices = JSON.parse( invoices );
            invoices.push( invoice );
            localStorage.invoices =  JSON.stringify(invoices);    
        }

        $("#txtInvoiceTitle, #txtInvoiceAmount, #txtInvoiceDescription").val("");

        // $("#settingsModal").modal("hide");

        $("#requestForm").hide();
        $("#invoiceCountLine").show();

        // $("#newRequestMsg").html("Your " + htmlEncode(invoice.type) + " has been created. You can access your " + htmlEncode(invoice.type) + " in the future by clicking on the settings icon in the top bar." ).show();
        // setTimeout(function ()
        // {
        //     $("#newRequestMsg").slideUp();
        // }, 5000);


        delete invoice.myAddress;

        urlHash =  btoa( encodeURIComponent( JSON.stringify(invoice) ));

        rush.updateInvoices( invoice.type );

        $("#btnNewRequest").show();


    },
    "generateNow": function ()
    {
        amount = $("#txtReceiveAmount").val();

        if ( this.useFiat2 )
        {
            amount = parseFloat( amount ) / this.price;
            amount = btcFormat( amount );
        }

        $("#receiveQR").attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=groestlcoin%3A" + this.address + "%3Famount%3D" + amount + "&chld=H|0");

        $("#generateAmount").html(amount);

        $("#generateAddress").html( this.address );
    },
    "updateInvoices": function ( type )
    {
        if ( !type )
        {
            type = "SmartFund";
        }

        invoices = localStorage.invoices;

        $("#invoicesBody").html("");
        $("#settingsChoices").hide();

        myInvoiceCount = 0;

        if ( invoices && invoices != '[]' )
        {

            invoices = JSON.parse( invoices );

            addresses = [];

            for ( i in invoices )
            {
                if ( invoices[i].myAddress == rush.address && (invoices[i].type==type || !invoices[i].type) )
                {
                    addresses.push( invoices[i].address );

                    myInvoiceCount ++;
                    $("#invoicesBody").prepend( "<tr><td><a class='openInvoice' invoiceNum='" + i + "'>" + htmlEncode( invoices[i].title ) + "</a></td><td>" + htmlEncode( invoices[i].invoiceid ) + "</td><td class='hidden-sm hidden-xs' id='inv_" + invoices[i].address + "'></td><td >" + htmlEncode( invoices[i].amount.toFixed(8) ) + "</td><td style='text-align:right;'><a class='openInvoiceWallet' title='Open " + getTypeName( type ) + " Wallet' invoiceNum='" + i + "'><span class='glyphicon glyphicon-folder-open'></span></a> <a class='sweepInvoice' title='Sweep Funds' invoiceNum='" + i + "'><span class='glyphicon glyphicon-log-in'></span></a> <a class='deleteInvoice' title='Delete' invoiceNum='" + i + "'><span class='glyphicon glyphicon-trash'></span></a></td></tr>" );
                }
            }
        }
        
        $("#invoiceCount").html(myInvoiceCount);

        $(".invoiceType").html( getTypeName( type ) );


        if ( myInvoiceCount < 1 )
        {
            $("#invoiceTx, #invoiceCountLine").hide();
            $("#noInvoice").show();

        }
        else
        {
            $("#noInvoice").hide();

            $("#invoiceTx, #invoiceCountLine").show();

            $.ajax(
            {
                type: "GET",
                url: "https://blockchain.info/multiaddr?cors=true&active=" + addresses.join("|"),
                async: true,
                dataType: "json",
                cache : false,
                data:
                {}

            }).done(function (msg)
            {
                for ( i in msg.addresses)
                {
                    address = msg.addresses[i].address;
                    balance = msg.addresses[i].final_balance;

                    balance = (balance / 100000000);
                    balance = balance.toFixed(8);

                    $("#inv_" + address).html( balance );

                }

                $("#invoicesBody td:nth-child(4):empty").html("0.00000000");
            });

        }

        $("#invoicesBody td:nth-child(5) a").tooltip(); //Tooltips
    },
    "getHistory": function ()
    {
        var url = "txs/" + this.address;

        $("#txTable tbody").html("");

        $.ajax(
        {
            type: "GET",
            url: url,
            async: true,
            dataType: "json",
            cache : false,
            data:
            {}

        }).done(function (msg)
        {
             if ( msg.txs.length > 0 )
            {
                $("#txBox").show();
                $("#noTx, #txList .break").hide();
            }

            //for ( i in msg.data.txs )
            for ( i=0;i<msg.txs.length;i++ )
            {
                txTime = moment( msg.txs[i].time_utc ).format( "MMM D YYYY [<span class='time'>]h:mma[</span>]" );

                $("#txTable tbody").append( '<tr><td>' + txTime + '</td><td class="hidden-sm hidden-xs"><a href="https://chainz.cryptoid.info/grs/tx.dws?' + msg.txs[i].hash + '.htm" target="_blank" >' + msg.txs[i].hash.substring(0,30) + '...</a></td><td class="hidden-sm hidden-xs">' +  formatMoney( msg.txs[i].confirmations || 0 ) + '</td><td>' + btcFormat( msg.txs[i].change/1e8 ) + '</td></tr>' );
            }

            $("#txTable tbody tr td:nth-child(4)").each( function ( i ) 
            {
                if ( $(this).html() > 0 )
                {
                    $(this).css({color: "#F49500", "text-align":"right", "padding-right": "30px"});
                }
                else
                {
                    $(this).css({color: "#52B3EA", "text-align":"right", "padding-right": "30px"});

                }

            });



            rush.getUnconfirmed();
        });

    },  
    "setTxFee": function ( fee )
    {
        this.txFee = parseFloat( fee );
        setCookie( "txFee", parseFloat(fee), 100 );
    },
    "getUnconfirmed": function ()
    {
        var url = "/unconfirmed/" + this.address;

        $.ajax(
        {
            type: "GET",
            url: url,
            async: true,
            dataType: "json",
            cache : false,
            data:
            {}

        }).done(function (msg)
        {
            unconfirmed = "";

            unconfirmedArr = Array();

            unconfirmedCount = 0;

            for ( i in msg.data.unconfirmed )
            {
                unconfirmedCount++;
                if ( unconfirmedArr[msg.data.unconfirmed[i].tx] == undefined )
                {
                    unconfirmedArr[msg.data.unconfirmed[i].tx] = {};
                }

                if ( unconfirmedArr[msg.data.unconfirmed[i].tx].amount == undefined )
                {
                    unconfirmedArr[msg.data.unconfirmed[i].tx].amount = msg.data.unconfirmed[i].amount;
                }
                else
                {
                    unconfirmedArr[msg.data.unconfirmed[i].tx].amount += msg.data.unconfirmed[i].amount;
                }

                unconfirmedArr[msg.data.unconfirmed[i].tx].time_utc = msg.data.unconfirmed[i].time_utc;
            }

            if ( unconfirmedCount > 0 )
            {
                $("#txBox").show();
                $("#noTx, #txList .break").hide();
            }
        

            for ( i in unconfirmedArr )
            {
                txTime = moment( unconfirmedArr[i].time_utc ).format( "MMM D YYYY [<span class='time'>]h:mma[</span>]" );

                unconfirmed += '<tr><td>' + txTime + '</td><td class="hidden-sm hidden-xs"><a href="https://chainz.cryptoid.info/grs/tx.dws?' + i + '.htm" target="_blank">' + i.substring(0,30) + '</a></td><td class="hidden-sm hidden-xs">0</td><td>' + btcFormat( unconfirmedArr[i].amount ) + '</td></tr>';
            }


            $("#txTable tbody").prepend( unconfirmed );

            $("#txTable tbody tr td:nth-child(4)").each( function ( i ) 
            {
               if ( $(this).html() > 0 )
               {
                   $(this).css({color: "#F49500", "text-align":"right", "padding-right": "30px"});
               }
               else
               {
                   $(this).css({color: "#52B3EA", "text-align":"right", "padding-right": "30px"});

               }

            });



        });

    },
    "get24Chart": function() 
    {
        if ( this.chartLoaded )
        {
            $("#chartBox").slideDown();
            return;
        }

        $.ajax({
           type: "GET",
           url: "https://api.bitcoinaverage.com/history/" + rush.currency + "/per_minute_24h_sliding_window.csv",
           dataType: "text",
           cache : false,
           success: function(allText) 
            {
                rush.chartLoaded = true;

                var allTextLines = allText.split(/\r\n|\n/);
                var headers = allTextLines[0].split(',');
                var lines = [];

                for (var i=1; i<allTextLines.length; i++) {
                    var data = allTextLines[i].split(',');
                    if (data.length == headers.length) {

                        var tarr = [];
                        for (var j=0; j<headers.length; j++) {
                            tarr.push(data[j]);
                        }
                        lines.push(tarr);
                    }
                }


                hours = [];

                for ( i in lines )
                {
                    if ( i % 2 == 0 )
                    {

                        var date = new Date( lines[i][0] + " GMT");

                        unix = date.getTime()  ;

                        hours.push( [unix, lines[i][1] ] );
                    }
                    

                }

                $("#chartBox").slideDown();

                $.plot("#chart24", [ hours ],
                    {       
                           xaxis: {mode:"time", timeformat: "%H", timezone: "browser", tickSize: [3, "hour"]},
                           colors: ["#F49500"],
                           grid: {
                            color: "#64657A",
                            borderColor:"#3E3F4D",
                            borderWidth:1
                           }
                   }

                );


            }


        });
    },
    "getBalance": function ()
    {
        var url = "getBalance/"+ this.address;

        $.ajax(
        {
            type: "GET",
            url: url,
            async: true,
            cache : false,
            data:
            {}

        }).done(function (msg)
        {
            msg = msg.balance;

            rush.balance = msg / 100000000;
            var spendable = rush.balance - rush.txFee;

            if (spendable < 0)
                spendable = 0;

            $("#btcBalance").html( btcFormat( rush.balance ) );
            $("#spendable").html("à¸¿" + btcFormat( spendable ) );

            rush.getFiatPrice();

            setTimeout( function () {rush.getHistory()}, 1000);

        });



    },
    "getFiatPrefix": function()
    {
        switch ( this.currency )
        {
            case "USD":
		  return "$";
            case "CNY":
                return "Â¥";            
            case "EUR":
                return "â‚¬";            
            case "GBP":
                return "Â£";            
            case "JPY":
                return "Â¥";
            case "RUB":
                return "Ñ€ÑƒÐ± ";            

            default:
                return "$";
        }
    },
    "getFiatValue": function ()
    {
        this.fiatValue = this.price * rush.balance;

        $("#fiatValue").html( this.getFiatPrefix() + formatMoney(  this.fiatValue.toFixed(2) ) );

        $("#currentPrice").html( this.getFiatPrefix() + formatMoney(  rush.price.toFixed(2)  ));
    },
    "getFiatPrice": function ()
    {
        currency = this.currency;

        $.ajax({
            type: "GET",
            url: "ticker",
            async: true,
            cache : false,
            data: {},
            dataType: "json"

        }).done(function (msg) {
            

            price = msg[currency].last;

            rush.price = price;

            price = price.toFixed(2);

            $("#price").html(rush.getFiatPrefix()+formatMoney(price) ).show();

            $("#currencyValue").html( rush.currency );

            $(".currency").animate({opacity:1});

            rush.getFiatValue();


        });

    },
    "amountFiatValue": function ()
    {

        var amount = $("#txtAmount").val();

        amount = parseFloat(amount);

        if (!amount)
        {
            amount = 0;
        }

        
        if ( rush.useFiat )
        {
            var btcValue = amount / this.price;
            btcValue = btcFormat( btcValue );
            $("#fiatPrice").html("(à¸¿" + btcValue + ")");

        }
        else
        {
            var fiatValue = this.price * amount;

            fiatValue = fiatValue.toFixed(2);

            $("#fiatPrice").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + ")");
        }

    },
    "amountFiatValue2": function ()
    {

        var amount = $("#txtReceiveAmount").val();

        amount = parseFloat(amount);

        if (!amount)
        {
            amount = 0;
        }

        
        if ( rush.useFiat2 )
        {
            var btcValue = amount / this.price;
            btcValue = btcFormat( btcValue );
            $("#fiatPrice2").html("(à¸¿" + btcValue + ")");

        }
        else
        {
            var fiatValue = this.price * amount;

            fiatValue = fiatValue.toFixed(2);

            $("#fiatPrice2").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + ")");
        }

    },
    "prepareReset": function ()
    {
        setMsg("Are you sure you want to generate a new address? <strong>This will delete your current one and all funds associated with it.</strong> <br/><button id='confirmReset'>Yes</button> <button id='noReset'>No</button>");
    },
    "reset": function ()
    {


        $("#errorBox").hide();

        // chrome.storage.local.set(
        // {
        //     'encrypted': false
        // }, function () {});

        $("#balanceBox").hide();
        $("#password").hide();
        $("#preparePassword").show();
        this.encrypted = false;
        this.passcode = "";
        this.address = "";
        this.txSec = "";
        entroMouse.string = "";
        entroMouse.start();

    },
    
    "txComplete": function ()
    {
  
        ga( "send", "event", "Send", "Wallet" );

        setMsg("Payment sent!", true);


        $("#sendBtn").removeAttr("disabled");
        $("#sendBtn").html("Send");

        this.txSec = "";
        
        if ( rush.sweeping != "" )
        {
            rush.address = rush.sweeping;
            this.sweeping = "";
        }


        $("#password").val("");

        $("#txtAmount").val("").css({"font-size":"14px"});
        $("#txtAddress").val("");
        $("#fiatPrice").show();

        $("#oneNameInfo").hide();


        this.getBalance();
        playBeep();

        rush.getBalanceBlock = true;

        setTimeout( function ()
        {
            rush.getBalanceBlock = false;
        }, 1000);

    },
    "exportWallet": function ()
    {

        if (!this.encrypted)
        {
            setMsg("" + rush.passcode);
        }
        else
        {
            if ($("#password").val() == "")
            {
                setMsg("Please enter password to decrypt wallet.");
                return;
            }

            var passcode = CryptoJS.AES.decrypt(this.passcode, $("#password").val());

            var passcode = passcode.toString(CryptoJS.enc.Utf8);

            if (!passcode)
            {
                setMsg("Incorrenct Password!");
                return;
            }

            setMsg("Brainwallet: " + passcode);

            $("#password").val("");

        }

    },
    "importWallet": function ()
    {
        setMsg("Importing a brain wallet will replace your current wallet. You will lose your balance if you haven't backed it up!<br/><input type='text' id='importBrainTxt' placeholder='Brainwallet'> <button id='confirmImport'>Import</button>");
    },
    "confirmImport": function ()
    {

        if (!$("#confirmImport").attr("confirmed"))
        {
            $("#confirmImport").html("Are you sure? Click to confirm!").attr("confirmed", "true");
            $("<button id='clearBox'>No</button>").insertAfter("#confirmImport");
            return;
        }

        rush.passcode = $("#importBrainTxt").val();

        var bytes = Bitcoin.Crypto.SHA256(rush.passcode,
        {
            asBytes: true
        });

        var btcKey = new Bitcoin.Key(bytes);
        var address = btcKey.getBitcoinAddress().toString();

        rush.address = address;

        $("#password").hide();
        $("#preparePassword").show();
        this.encrypted = false;
        this.txSec = "";

        chrome.storage.local.set(
        {
            'code': rush.passcode,
            'encrypted': false,
            'address': address
        }, function ()
        {
            rush.open();

        });

        setMsg("Brainwallet imported succesfully!");



    }
    
   


};

function popup(txt)
{
    setGPGMsg('<textarea id="gpgBox" readonly></textarea>');

    $("#gpgBox").val(txt);
}

function popupMsg(txt)
{
    // txt = txt.replace(/\n/g, '<br />');
    setGPGMsg('<div id="messageBox">' + txt + '</div>');
}


$(document).ready(function ()
{

    var code = window.location.hash;


});

Date.prototype.format = function (format) //author: meizz
{
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "H+": this.getHours(), //hour
        "h+": ((this.getHours() % 12)==0)?"12":(this.getHours() % 12), //hour
        "z+": ( this.getHours()>11 )?"pm":"am", //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }

    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

function formatMoney(x)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function htmlEncode(value)
{
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function s2hex(s)
{
    return Bitcoin.convert.bytesToHex(Bitcoin.convert.stringToBytes(s))
}

function playBeep()
{
    var snd = document.getElementById('noise');
    snd.src = 'balance.wav';
    snd.load();
    snd.play();
}

function playBaron()
{
    var snd = document.getElementById('noise');
    rush.snd = snd;
    snd.src = 'baron.mp3';
    snd.load();
    snd.play();
}

function playTurn()
{
    var snd = document.getElementById('noise');
    rush.snd = snd;
    snd.src = 'turn.mp3';
    snd.load();
    snd.play();
}

function ajax(url,success,data) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            success(xhr.responseText);
            xhr.close;
        }
    }
    xhr.open(data ? "POST" : "GET", url, true);
    if (data) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}

function tx_fetch(url, onSuccess, onError, postdata)
{
    $.ajax(
    {
        url: url,
        data: postdata || '',
        type: "POST",
        cache : false,
        success: function (res)
        {
            onSuccess(JSON.stringify(res));

        },
        error: function (xhr, opt, err)
        {
            // console.log("error!");
        }
    });
}

function setMsg( msg, green )
{
    $("#errorBox").slideDown();
    $("#errorTxt").html( msg );

    if ( green )
    {
        $("#errorBox").addClass("green");
    }
    else
        $("#errorBox").removeClass("green");

    setTimeout( function ()
    {
        $("#errorBox").slideUp();
    }, 5000);

}
