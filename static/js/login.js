/**
 * Created with PyCharm.
 * User: todd
 * Date: 11/29/12
 * Time: 11:19 PM
 * To change this template use File | Settings | File Templates.
 */
minPassLength=4;
maxUserLength=20;

$(document).ready(function() {
    // event handler for login pressed
    $('#login_button').on('click', function() {
        login();
    });

    // event handler for register pressed
    $('#register_button').on('click', function() {
        register();
    });

    // Handle enter key pressed
    $(".login_fields input").keypress(function(e) {
        if(e.which == 13) {
            e.preventDefault();
            login();
        }
    });
    $(".register_fields input").keypress(function(e) {
        if(e.which == 13) {
            e.preventDefault();
            register();
        }
    });


});

function login() {
    // get values from input
    var username = $('#userid').val();
    var pword = $('#pword').val();

    // one of the fields is empty
    if (username == '' || pword == '') {
        $('#login_message').text("One of the fields is empty.");
        return;
    }

    // make user object to pass to server for check
    var user = {
        username: username,
        password: pword
    };

    // ajax request to check validity of login with server
    $.ajax(
        {
            type: "POST",
            url: 'login_check',
            data:$.param(user),
            dataType: "text",
            success: function (data) {
                if (data == 'success') {
                    // redirect to home page
                    window.location.href = window.location.href.replace('/login', '');
                }
                else if (data == 'invalid login') {
                    $('#login_message').text("Invalid login. Try again!");
                }
            }
        }
    );

}

function register() {
    // get values from input
    var username = $('#new_id').val();
    var pword1 = $('#new_pword').val();
    var pword2 = $('#new_pword2').val();

    // check for empty fields
    if (username == '' || pword1 == '' || pword2 == '') {
        $('#register_message').text("One of the fields is empty.");
        return;
    }
    if(pword1.length < minPassLength)
    {
        $('#register_message').text("Please enter a longer password.");
        return;
    }
    if(username.length > maxUserLength)
    {
        $('#register_message').text("Please enter a shorter username.");
        return;
    }
    // ensure matching passwords
    if (pword1 != pword2) {
        $('#register_message').text("The passwords do not match.");
        return;
    }
    if (username.search(",") != -1)
    {
        $('#register_message').text("No Commas Please!")
        return;
    }


    // make user object to pass to server
    var user = {
        username: username,
        password: pword1
    };

    // ajax request to create new User
    $.ajax(
        {
            type: "POST",
            url: 'register',
            data:$.param(user),
            dataType: "text",
            success: function (data) {
                if (data == 'success') {
                    // redirect to home page
                    window.location.href = window.location.href.replace('/login', '');
                }
                else if (data == 'failure') {
                    $('#register_message').text("Username already exists");
                }
            }
        }
    );

}