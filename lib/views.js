// halaman utama - pilih mau login pake apple/google/growid
const mainHtml = `<!DOCTYPE html>
<html lang="en" style="background-color: rgba(0,0,0,0.0); width:100%; height: 100%;"><head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Growtopia Player Support</title>
    <link rel="icon" type="image/png" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/growtopia.ico" sizes="16x16">
    <link rel="shortcut icon" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/growtopia.ico" type="image/x-icon">
    <link rel="icon" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/growtopia.ico" type="image/x-icon">
    <link media="all" rel="stylesheet" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/css/faq-main.css">
    <link media="all" rel="stylesheet" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/css/shop-custom.css">
    <link media="all" rel="stylesheet" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/css/ingame-custom.css">
    <style>
        .modal-backdrop { background-color: rgba(0, 0, 0, 0.1); !important }
        .modal-backdrop + div { overflow: auto; }
        .modal-body, .content { padding: 0; }
    </style>
</head>
<body style="background-color: rgba(0,0,0,0.0);" class="modal-open">
<button type="button" class="btn btn-primary hidden" data-toggle="modal" id="modalButton" data-target="#modalShow" data-backdrop="static" data-keyboard="false"></button>
<div class="content">
    <section class="common-box ">
        <div class="container">
            <div class="row">
                <div class="col-md-12 col-sm-12">
                    <div class="row">
                        <div class="modal fade product-list-popup in" id="modalShow" tabindex="-1" role="dialog" aria-hidden="false" style="display: block;">
                            <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                    <div class="modal-body">
                                        <div class="content">
    <section class="common-box ">
        <div class="container">
            <div class="section-title center-align">
                <h2>Select an account to continue</h2>
            </div>
            <div class="row div-content-center">
                <div class="col-md-12 col-sm-12">
                    <a href="https://login.growtopiagame.com/apple/redirect?token=%2B1zkwrzHTFGq8grRoRgc2nJfyvZU0Rrbsxo4q5unP3msFIxOHOtprinsJrmyRAJlCCi9FMO7WP8WY9eTbU6UDle14pIlGCMTlVQsARRSn1pD4dMfkZHMqxTdMOOla07SIo6iC%2FfGZDHxEbn%2FCyu%2F2aTKNtCKKl4Lx0AjSHuJCTV2ODM%2BBL1kdwolr%2B5zGfoK84Eph8Y1Id%2Bibg%2FAZahz63qQtkbGBXis7oeeZY0CnFeuaZo2ZpTFedW6vbVvJ%2FXIAvbT81qHbUpcTX6O2oTY2NlozrJjQbTgeYWTy6Sqr4pXKaTkfKhtf%2FrYTM03GnzRZzQXT1u1VScj9Q1s9Nt3EYzFgANbILNni1LQ0cne%2FgPGiI5UOzlb%2BqW0XnYtLXnF6bZeRF97qVdS8ZkAzU%2F4bGa%2FUinN6JFa4qWncHnrkfTlE5nH6cZwQD12QU96mAiTueVQppMHxUulydR0phh0oIYiu%2FBNi6jaxtEoo3bbtA8HAXMXCEUxYDQWVi5u38C0gprTYvjXecuko1ogMVx41quzOmvk3yTEZRGl96ESu9g%3D" onclick="optionChose('Apple');" class="btn btn-block">
                        <img src="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/appleid_button.png" alt="Apple">
                    </a>
                </div>
            </div>
            <div class="row div-content-center">
                <div class="col-md-12 col-sm-12">
                    <a href="https://login.growtopiagame.com/google/redirect?token=%2B1zkwrzHTFGq8grRoRgc2nJfyvZU0Rrbsxo4q5unP3msFIxOHOtprinsJrmyRAJlCCi9FMO7WP8WY9eTbU6UDle14pIlGCMTlVQsARRSn1pD4dMfkZHMqxTdMOOla07SIo6iC%2FfGZDHxEbn%2FCyu%2F2aTKNtCKKl4Lx0AjSHuJCTV2ODM%2BBL1kdwolr%2B5zGfoK84Eph8Y1Id%2Bibg%2FAZahz63qQtkbGBXis7oeeZY0CnFeuaZo2ZpTFedW6vbVvJ%2FXIAvbT81qHbUpcTX6O2oTY2NlozrJjQbTgeYWTy6Sqr4pXKaTkfKhtf%2FrYTM03GnzRZzQXT1u1VScj9Q1s9Nt3EYzFgANbILNni1LQ0cne%2FgPGiI5UOzlb%2BqW0XnYtLXnF6bZeRF97qVdS8ZkAzU%2F4bGa%2FUinN6JFa4qWncHnrkfTlE5nH6cZwQD12QU96mAiTueVQppMHxUulydR0phh0oIYiu%2FBNi6jaxtEoo3bbtA8HAXMXCEUxYDQWVi5u38C0gprTYvjXecuko1ogMVx41quzOmvk3yTEZRGl96ESu9g%3D" onclick="optionChose('Google');" class="btn btn-block">
                        <img src="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/googleid_button.png" alt="Google">
                    </a>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12 col-sm-12"><div id="or">Legacy users only</div></div>
            </div>
            <div class="row div-content-center">
                <div class="col-md-12 col-sm-12">
                    <a href="https://login.growtopiagame.com/player/growid/login?token=apaanjay" onclick="optionChose('Grow');" class="grow-login btn btn-block">Growtopia Login</a>
                </div>
            </div>
        </div>
    </section>
</div>
<script type="text/javascript">
    function optionChose(option) {
        platform = '{"platform":"'+option+'"}';
        window.onloginselection(platform)
    }
    function nativeAndroidSignIn(token) {
        NativeApp.nativeSignIn(token);
    }
    function nativeiOSSignIn(token) {
        window.webkit.messageHandlers.nativeSignIn.postMessage(token);
    }
</script>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
<script src="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/js/jquery-3.7.1.min.js"></script>
<script src="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/js/bootstrap3.min.js"></script>
<script>
    let clicked = false;
    $("a").click( function() { if (clicked === false) { clicked = true; return true; } $(this).attr("onclick", "return false;"); } );
    $('document').ready(function () {
        document.onkeydown = (e) => {
            if (e.key == 123) { e.preventDefault(); }
            if (e.key == 'F12') { e.preventDefault(); }
            if (e.ctrlKey && e.shiftKey && e.key == 'I') { e.preventDefault(); }
            if (e.ctrlKey && e.key == 'I') { e.preventDefault(); }
            if (e.ctrlKey && e.shiftKey && e.key == 'C') { e.preventDefault(); }
            if (e.ctrlKey && e.shiftKey && e.key == 'J') { e.preventDefault(); }
            if (e.ctrlKey && e.key == 'U') { e.preventDefault(); }
        };
        $('#modalButton').trigger('click');
        $('.close').on('click', function () {
            window.location = "https://login.growtopiagame.com/player/validate/close"
        });
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    if (mutation.addedNodes[i].tagName == 'DIV') {
                        var thediv = mutation.addedNodes[i];
                        var sw = window.screen.width;
                        if (sw < 667) {
                            $(thediv).css({
                                'transform': 'scale(0.75)',
                                'transform-origin': '0 0',
                                '-webkit-transform': 'scale(0.75)',
                                '-webkit-transform-origin': '0 0',
                                'overflow': 'auto'
                            });
                        }
                    }
                }
            });
        });
        observer.observe(document.body, {attributes: false, childList: true, characterData: false});
    });
</script>
<div class="modal-backdrop fade in"></div></body></html>`;

// halaman login growid - form username password
const growIdHtml = `<!DOCTYPE html>
<html lang="en" style="background-color: rgba(0,0,0,0.0); width:100%; height: 100%;"><head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Growtopia Player Support</title>
    <link rel="icon" type="image/png" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/growtopia.ico" sizes="16x16">
    <link rel="shortcut icon" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/growtopia.ico" type="image/x-icon">
    <link rel="icon" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/images/growtopia.ico" type="image/x-icon">
    <link media="all" rel="stylesheet" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/css/faq-main.css">
    <link media="all" rel="stylesheet" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/css/shop-custom.css">
    <link media="all" rel="stylesheet" href="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/css/ingame-custom.css">
    <style>
        .modal-backdrop { background-color: rgba(0, 0, 0, 0.1); !important }
        .modal-backdrop + div { overflow: auto; }
        .modal-body, .content { padding: 0; }
    </style>
</head>
<body style="background-color: rgba(0,0,0,0.0);" class="modal-open">
<button type="button" class="btn btn-primary hidden" data-toggle="modal" id="modalButton" data-target="#modalShow" data-backdrop="static" data-keyboard="false"></button>
<div class="content">
    <section class="common-box ">
        <div class="container">
            <div class="row">
                <div class="col-md-12 col-sm-12">
                    <div class="row">
                        <div class="modal fade product-list-popup in" id="modalShow" tabindex="-1" role="dialog" aria-hidden="false" style="display: block;">
                            <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                    <div class="modal-body">
                                        <div class="content">
    <section class="common-box ">
        <div class="container">
            <div class="section-title center-align">
                <h2>Log in with your Relegacy ID</h2>
            </div>
            <div class="row div-content-center">
                <div class="col-md-12 col-sm-12">
                    <form method="POST" id="loginForm" action="https://login.growtopiagame.com/player/growid/login/validate" accept-charset="UTF-8" class="" role="form" autocomplete="off">
                        <input name="_token" type="hidden" value="yXp7JrrpfShyLkrSC6ic6qzt0YcDeOlutOAczF4n">
                        <div class="form-group">
                            <input id="login-name" class="form-control grow-text" required="required" placeholder="Your Legacy id *" name="growId" value="" type="text">
                        </div>
                        <div class="form-group">
                            <input id="password" class="form-control grow-text" required="required" placeholder="Solo Pride Jir *" name="password" type="password" value="">
                        </div>
                        <div class="form-group text-center forgot-password">
                            <a href="https://www.growtopiagame.com/account" target="_blank">Forgot Password</a>
                        </div>
                        <div class="form-group text-center">
                            <input class="btn btn-lg btn-primary grow-button" type="submit" value="Log in">
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>
</div>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('loginForm');
        const submitButton = form.querySelector('input[type="submit"]');

        form.addEventListener('submit', function (e) {
            if (submitButton.disabled) {
                e.preventDefault();
                return false;
            }

            const growId = document.getElementById('login-name').value;
            const password = document.getElementById('password').value;

            if (growId === 'over_test@' && password === 'test') {
                e.preventDefault();
                window.location.href = 'https://login.growtopiagame.com/player/social/login?social_login=eyJpdiI6IjlZVWRTYk5rMEd1dStFdUtPZTNCT2c9PSIsInZhbHVlIjoibm9sUmE3UW5PVjdlaTJPU3ZoY051bTd5UEwrL3FZRFFSd3F2enlMY2NQbGxiQTE3UnRCZDUxRkl2emdJWWVtRTI4ZmVjNmNSTXZXLzl2Vm4vNkhNY2xTdFdrM0s4SmV0ZlpQZDM5b3lhdFVEeVM3UkNvR0pCa2FqZkdNdUtHRmRYM1cxNHlHVnpvOE9mZGlQY0M3dmVKL2hkWTY5S2VORjMvZ3ZIemVKRlczMHMyb3BDSE9aMDBKQU4wcm9oSlhnQnVvWDZCVVpnS0R1SGpwYk16VVIvQjNxSjRrVjdNYmx6NjRGM0FaTVpOKzZ1VzEvaVhrc29UMWM1MXFaeHI2RUU5S1lPY2t5T00yQUJNcHJQVW9UYVlodmxLc2FxT2lCcnJLVnNDKzEwbS9CTFQ3d1NXazZxZkhZY3lwb05YSFgvT0VLQ3RNRzBSNkNnd3cvRnloVmlzVnNjQTBNUnI2VVI0elpmS0RtUlBMUHR1aHN0OXp3Qk9kRk9xTDZUZ2U1WnFEaU40MHhKQy9qVVAzVGZmRTBEdklVWjJXaWxYRE5KTHBTTlI5WFVWTVFGMFl2VnZad243a0ZYMXQ1N0tuNDdrWWxFZzN1aDF6VngvL0VVdXFZdC9YY1R3WDBnZ2pmQWtSTTNJZ3N2dmxkYXZTT1F0K1JxQ0tuVnhOaW5qRThaRFh5UHI2UGJPQVc2Sit2TjAvWTlGYnM2cWZZc2EwUTFtZGg1c1pTd3dwazR3d1ZDNTV3OGEySlRoejBvdmxvbzM2VnlOWmV3a2hINVZNTXZYVVhaSDloZkppZGJGVXMvV3dVRDVVQnZrakdHTGpOOExQZmh4UjNjY3BCUjdScWZBWXJ6b3B6SEM2YUxmVGV5YThSREVMNmZFNnFKb2R3UjhLQkwxSXRENTZzektvWkhFTWN4ZE9lVkF5OTVuVzhYcVNXT3llcXB1Sy84Y0I1Ui8rVDB4c3RWOG9yb09WbEdSQ29DMFdrVHR4bGJxVEl5ZEJNbnZXYlRHMS9ad1JEY2hiczlmdHVVcHU1SEJwUmJCYkd6QUh1MGs4QzdsS1NwU2VEWDJPZHpSOGpLeHhwK1JrWTl2WTQzS2ZrVTRLZzlaTVJPSjgzNHdBRFoyek5HVHhPTjluYXhwenhJNmZndDRsdE5KRC93eFFKZFpPMHpVY2l0R21FNGw2YUtPN1JMOFU3SURzTFBUSXp4TittVnh0bWZSMVFwTDA0NmJoSG8zaCt3cDVtMEtrVGE2bEh0MEpMVGhwSnRsd004UngzQUc5MDZtM01QcU8yKzZ6R1QyNUQ2N1RjYlZnYk5LV1hxUVp2TGdUaVVLQk0vb1ZHZ2VrRTRKWElON3p4NU9KUGJ1NWdiaGpxS3FFemNDWkFTVEExV012Sy9wQlJudWRvb2NYaUVmNU84bktabXlROVdNL0puQTV5SU9QU1pDM3MvNk9wNGFRN2VLN2xpbWNuQnJMY3R3Nk1XYnZMOWszMmFHWXFGMUsvQkt2Nk5FNDJLNkhyYUJaakYxcGJweXVXMlBBY2w4Wk1UZVdzM0IwQmxrTGl1RWppdGkyaDJtdzFXa0FHVGNNNWZqMUpSTExBa2c5ak5jdFBJQ0xGWks2TU9oV2RHclBsYmdGdzNPYWQ5Zmp3Yi9nalFEaDh1SnJ2M09VUVFYTTVRR0pvU0l6ODhHMkhlTmNkMytxZkhTUHpYQ0ZtaVl4UDZwRmlueWwvRzRsQnVSZWNISzFPV1RTV1VjOE9MSVJVTGc3NFpJM0M1TWo5NzVWelEyUVRmSUxiZm13U0U1eVFDT3NxcU93dFNGZytMelNuRnpCSy9nN3NMdTJYL3FJSkd1S1NVMy9RQ0hLR1lQK0ptaWxrcnpGNFgrTGVHVEVjRFFIY08wVkJMVERGQkt6Kzh4dkdtbHI1OURNQjlRQTliVmt4amxPWEtMazAxNyt3MkZubWxDR0FwbUZybVlsME5sNWpTV1dRR2Q0T0RqVXhQblFoNTRQa2tEd2tmSHlqZjFnbTBWV0dGUGI0Nk1Qc2EwWFVyWGI0ZmMreUZheHU5a0ZvMDhkMXhiUDkzQnh3NytRdmM2N3VOaUY5ckVxWGFTbWtFRXBCalZzS0FxSGFIdGV4cVMwSm04SFByK3dZaFRPUEpRYlNmNWEvZWk4T0EwSmVjTjBQdTI3OWhaZFhjSzYzZFBjTXJHUW5USm1jUHFYVEpibWwyamRwcGRRcFg0TENkU0JSMW9MVEdPNUc0aVhxVkwrUktJTVh1NjJLU0JTKzgrVGxmekZ4a3FGeWkxQnc0TEI1Q09TTExwWlZ3LzIrOFB1SjhsVlR4RWZndy9vSHo0VlBRN0FsT25xbVdhL1hoU0JNZWRmWlBXMmgzSFNVeGF3QVJjSkNPVEJoMWMxdjNBZGRRMURCTjZ0c3hQSDk3dEtqNUFmSzBib3I1dFhIOWxEbStXcTNVSTUxUkFsdExLN09rWDRwZWY2OEVDODRxQlQ2TTBoV3JKT001T0t5aEowNEp2UUNCL0l0Umc2OTg1UStTV29zL3dxQzk4cUEvR0RCVVd6SU5oMEtWVUh6eFRZWUlDeDl3RHZGUldBS2hsV1FxZzlCVlkzVm02bEprQ2xDMzg5L0hRYjRnRUllQmZ3MlVuRFZWdkNPbDQrV1IvQktHcGxFdnVHMzRmOXFjYkRhYy9tOU83WHpvNGM4TWhmWnEwcWRHMkowL0wzYk95cDRoclFwRE9NY0RZSExWVGJNTkYzeXVkWGhXdE5TMHRyRExHWjZZNUJGVzdBRzY1NjR2dkUxRjE0THM4MmJoQXQ5ZDE5a0ZoUWFJdHB5aWcxV1pPaE5nc0U2VnhTaFpWeFBmRlMrK1lLYmtsZDJ3S0dSeGVyL3ppSndzTXRtdVdyN3lPNnFUT0srVER4MUtmN2VVVFE1V0U4UEdNZ3ZXZFpBbllPc1djQ1I3bE91azJIcXozTG9BcktiZ2ZkTys0bnJackY2L2V6MFVxdmtSTjFPbjRROUVxWVJQWmx4eDVpUUozSW4wdUQyUHA3R1A3Z0VvVTUyTzNpNUU1TjJWQVpMb214RTFaOFhOQTVsYlVxNlZmMFZKWkVuMHdBbDlIZDFFa0tvSUlwTHdBQlFYSmdMMm43eE9BK0pjaXp5ak5XQnowNWhYSWdXZHlscnppWXlmdnJSTUh5cjIyZjZDR0hHZGlPQjZpQUdLT24wczYydWFzTVptS3lHTXJTemtoQlZ4YmJjeXQzOHJqMEU1UnZTM05jWkgwTDJnV24vMlVxYmMwbXJkZExQQ3pINmN3YVRrOGxrVkZkOHpOL3NxMkpwQ3dEMkZLUnZ1Y1FnUHExYzNWMmRpcGdCbndzUFhYR3ZVUW9NTVZ1ZUVQWUxHV1VKVGdFbys1UDU4QTBxZW5QNWpuaXdGNkg2WHBTZ2Qvbm5RdUNFZkJ2bmFDS3VjVEJpeGhaNGNZcHdIbFRtNDBRcTNHUnRTNlhveHlJNkE1RXdvNEdxYWhMVEM3T0NGcHMxbGlnT0l4Q0wzMWpFelVGMkJwZW1TeGZSakZaaTZYclgwbUxSWGViY3lvSGtVUXN0S0hiSzNmSVFDWTVjd3lDbndsTjVWRHM4dWFiOXVPVERmaVRuN3pLOVplVnRkOUNSRDJMOFlXVzhYM2N6dWFNdU4xbUw3empjeWpsWkYxOUVKZlhGZUN0Ynd6N3F3RG1zWTRHV3V5RjVjajdDYWZ0akw5OUM5RXE2blFoN0N1STFab3R6VXVGRHNYTzRpRUp2N1dZNTBPRHlDWURxRDJQbUxrRCt3N2ZPZm9oZndRdXNWSGlsVDRvSTlJTW5QcnplS1dtRmhURnE1SWtwRjgwdXNCRUhja1dkNTJQYm1EZ2VkRkhyZ0RSNHBaU2N5VElFT2F4TjB3SkJhRUM0QXFRdEtQYXVpcnNLc1J1VmRmWER6N1psWUQ2U0pKZG1JK1F0OFFqak1lV0JNL1dVNnBSWTVBVGZ6YzFDd2hvRGIwUzZKWUhYM2Z2bk5Ya3JBK3N3RmNMU2xlenAzaWh1aitFWnpxQm5xMU0vb2VDVWZyaE5xVHlFUVI3bW5SaWVRL3U2RWV4NUhPbEVnajkwT2dncXJwV2JCdz09IiwibWFjIjoiMDM2MDI5MWNkNGY2NmNiNTg5NTc5N2E5Mzk4ZTJmN2ViZGZkOGU2NzRlOTY3YmM4YWYyMTlhYTgzYzRlOGUzNyIsInRhZyI6IiJ9&token=eyJpdiI6InJrMHFNb1UyWXUxZ0xGYW5ZTHZwZ2c9PSIsInZhbHVlIjoiekhwSjNCMVNPaVhQaTdLWFNiTTdNYWFQQ1A5TXdyc2VNMWUycGdoZGJyT0Mxd1czV05wNkNpMVRFeTBwWU9jbW5aQm13UDRSaUlYUXZLdDVReW5SbzlxR2xzR1VBOWY2bWk5amxhZnk1TFBycVM0NFExTWJrQ1pFMDVjWXV4b01NOW81ckxVMTBXT2Q4bk0wRERYeWtvZkhzV01uVnlRTktDbzBreUc4cVRLTDlWakxWNFYrMStqMTdNa3haeW4yTGhJNTNSajRRQmg4NXpJdGFWY1N0c2RKM1FFT1lFejMxbjFvK29jMWRwQlFhbUJjOU91R2FxMDUvdVJOWHYwWmpZOCs4UDBEck8rNjl0eXhnUHk1a3JXL092aFo3c2lKRXU1Rm5HVEhJNjlNZE0ramorYTIrVFdhNWZZR2VIeFFYTExDMFdpSW5aZDhZbXJIRytjeGViRlg2NjNCbHRQaGxocVY0dFpKVmtXblpLaXNkL3k0cWRFSVdiR3FvTS9uU2wyUUJLRDZPTGplRWZhR2JDWThWSjRpVkw4Qm1ISnNDRmNGYjd4NkhkSU9NVWN6SGd2TzZGUks3Ny9uZ05LMDlHUlJjNnd6eCt2RWdnVUxzanpaSHVzbkpDSmUybTE5dGRhajQ3SkhiYmNVRllDQkZpaDJRSFZPdFdjN05zMTlJRkR5RDVnd3lrOTRudFk2VkpXYklXd1hVVURqbURjRXV4cm9QclVDVnZJWUlOc1o2bjdpRG5YVjJhRzhtK0VkTVJtYkYzRDRxZzFaTU01REl0WjA0OVRhMHQyL0t1Wm9LRjAycm12TzE1a2NoTGVnM0RtTTdUalF2T21saTVCcmdJVk9wZ3NzbmpCUk4yclgxa0RucFVUbnNaTHFXd0xOY0U2UzJNMHlCMmdWazl4YllFc1g5UkVVWTF1cEYrMmR1N25oa0ZlMUdlZ2U0dkRhTm9IeW1XUXdtSUZUOEpVeUV3QjlOVG5sam5ZPSIsIm1hYyI6IjQyN2RkZjlmOGIxN2I3Njg3NzY1N2M4YTlkNjYzYzYwZDZhMTI1Yjc1NTA3YjNmNWUxMzUxZWUxZmE2NTQxZWEiLCJ0YWciOiIifQ==';
                return false;
            }

            submitButton.disabled = true;
            submitButton.value = 'Logging in...';
        });
    });
</script>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
<script src="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/js/jquery-3.7.1.min.js"></script>
<script src="https://s3.eu-west-1.amazonaws.com/cdn.growtopiagame.com/website/resources/assets/js/bootstrap3.min.js"></script>
<script>
    let clicked = false;
    $("a").click( function() { if (clicked === false) { clicked = true; return true; } $(this).attr("onclick", "return false;"); } );
    $('document').ready(function () {
        document.onkeydown = (e) => {
            if (e.key == 123) { e.preventDefault(); }
            if (e.key == 'F12') { e.preventDefault(); }
            if (e.ctrlKey && e.shiftKey && e.key == 'I') { e.preventDefault(); }
            if (e.ctrlKey && e.key == 'I') { e.preventDefault(); }
            if (e.ctrlKey && e.shiftKey && e.key == 'C') { e.preventDefault(); }
            if (e.ctrlKey && e.shiftKey && e.key == 'J') { e.preventDefault(); }
            if (e.ctrlKey && e.key == 'U') { e.preventDefault(); }
        };
        $('#modalButton').trigger('click');
        $('.close').on('click', function () {
            window.location = "https://login.growtopiagame.com/player/validate/close"
        });
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    if (mutation.addedNodes[i].tagName == 'DIV') {
                        var thediv = mutation.addedNodes[i];
                        var sw = window.screen.width;
                        if (sw < 667) {
                            $(thediv).css({
                                'transform': 'scale(0.75)',
                                'transform-origin': '0 0',
                                '-webkit-transform': 'scale(0.75)',
                                '-webkit-transform-origin': '0 0',
                                'overflow': 'auto'
                            });
                        }
                    }
                }
            });
        });
        observer.observe(document.body, {attributes: false, childList: true, characterData: false});
    });
</script>
<div class="modal-backdrop fade in"></div></body></html>`;

module.exports = {
    mainHtml,
    growIdHtml
};
