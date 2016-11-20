//
// SET YOUR CREDENTIALS HERE
//
var login       = '',
    password    = '';


var ip_url      = 'http://www.myglobalip.com/',
    base_url    = 'https://my.yota.ru/selfcare/',
    login_url   = 'login',
    dev_url     = 'devices',
    DEBUG       = false;

var casper = require('casper').create({
    verbose: false,
    logLevel: 'debug',
    waitTimeout: 2000
});

capture = function(name){
    casper.then(function() {
        this.capture(name, {
            top: 100,
            left: 0,
            width: 600,
            height: 600
        });
    });
};

show_usage_and_exit = function() {
    casper.echo("Usage: yota [ status | list | set <desired-speed> ]");
    casper.echo("\tstatus\t- Показывает текущий план и остаток дней");
    casper.echo("\tlist\t- Показывает список доступных скоростей для команды set");
    casper.echo("\tset\t- Устанавливает скорость Интернета");
    casper.exit();
};

if (!login.length || !password.length) {
    casper.echo("Пожалуйста настройте ваш login и password в файле yota.js !");
    casper.exit();
}

if (!casper.cli.args.length) {
    show_usage_and_exit();
}

if (casper.cli.args[0] === 'set') {
    if (casper.cli.args.length < 2) {
        casper.echo("Пожалуйста, укажите скорость (используйте команду 'list' для списка доступных парамтеров)");
        show_usage_and_exit();
    }
    if (casper.cli.args[1] === 64) {
        casper.echo("Бесплатный доступ (64 кбит/с) не может быть установлен при активной подписке");
        casper.exit();
    }
}

casper.start(ip_url);

casper.then(function() {
    var ip = this.evaluate(function() {
        var ip = $(".ip").get(0).innerText.split(".");
        return ip;
    });
    if (!ip) {
        this.echo("Нет подключения к Интернету ?!");
        this.exit();
    }
    var yota_ip_range = [ "178.176", "178.177", "109.188", "188.162" ],
        our_ip = ip[0] + '.' + ip[1];
    if (yota_ip_range.indexOf(our_ip) !== -1){
        this.echo("Вы подключены к Интернету через Yota");
    }
    else{
        this.echo("ВНИМАНИЕ: Вы НЕ подключены к Интернету через Yota !");
    }
});

casper.thenOpen(base_url + 'login');

if(DEBUG){
    capture('0.png');
}

casper.thenEvaluate(function(login, password) {
    $('input[id=IDToken1]').attr('value', login);
    $('input[name=IDToken2]').attr('value', password);
    $('#doSubmitLoginForm').click();
}, login, password);

if(DEBUG){
    capture('1.png');
}

casper.thenOpen(base_url + 'devices');

if(DEBUG){
    capture('2.png');
}

switch (casper.cli.args[0]) {
    case 'status':
        casper.then(function() {
            var current = this.evaluate(function() {
                var result = '';
                var f = $('.tariff-choice-form');
                var steps = sliderData[f.find('input[name="product"]').val()].steps;
                var offerCode = f.find('input[name="offerCode"]').val();
                for (var i = 0; i < steps.length; ++i) {
                    if(steps[i].code == offerCode) {
                        result = 'План: '+steps[i].name + '\nОсталось: ' + steps[i].remainNumber + ' дней';
                        break;
                    }
                }
                return result;
            });
            this.echo(current);
        });
    break;

    case 'list':
        casper.then(function() {
            var variants = this.evaluate(function() {
                var variants = [];
                var f = $('.tariff-choice-form');
                var steps = sliderData[f.find('input[name="product"]').val()].steps;
                for (var i = 0; i < steps.length; i++) {
                    var speedNumber = steps[i].speedNumber;
                    variants[i] = (/max/.test(speedNumber) ? 'max : ' : speedNumber +' : ')
                        + (steps[i].name || steps[i].description)
                        + '(остаток ' + steps[i].remainNumber + ')';
                }
                return variants;
            });
            for (var i = 0; i < variants.length; ++i) {
                this.echo(variants[i]);
            }
        });
    break;

    case 'set':
        casper.then(function() {
            var new_status = this.evaluate(function(speed) {
                var f = $('.tariff-choice-form');
                var steps = sliderData[f.find('input[name="product"]').val()].steps;
                var currentOfferCode = f.find('input[name="offerCode"]').val();
                var offerCode = null;
                var status = "";
                var isDisablingAutoprolong = false;
                for (var i = 0; i < steps.length; ++i) {
                    if (steps[i].speedNumber == speed || (speed == 'max' && steps[i].speedNumber.contains('max'))) {
                        offerCode = steps[i].code;
                        status = 'Новый План: '+steps[i].name + '\nОсталось: ' + steps[i].remainNumber + ' дней';
                        isDisablingAutoprolong = steps[i].isDisablingAutoprolong;
                    }
                }
                if (offerCode && currentOfferCode != offerCode) {
                    f.find("form").append("<input type='hidden' name='isDisablingAutoprolong' value='" + isDisablingAutoprolong + "'/>");
                    f.find('[name="offerCode"]').val(offerCode);
                    f.find('[name="productOfferingCode"]').val(offerCode);
                    f.submit();
                }

                return status;
            }, casper.cli.args[1]);
            this.echo(new_status);
        });
    break;

    default:
        casper.echo("Неизвестный аргумент " + casper.cli.args[0]);
        show_usage_and_exit();
}

if(DEBUG){
    capture('3.png');
}
casper.run();
