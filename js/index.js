var current_user;
var user_name;
var current_teacher = "RG";
var full_teacher_name = {
    "RG": "Rachel Green",
    "JT": "Joey Tribbiani",
    "MG": "Monica Geller",
    "DRG": "Dr. Ross Geller",
    "MH": "Mike Hannigan",
    "DRB": "Dr. Richard Burke",
    "PB": "Phoebe Buffay",
    "CB": "Chandler Bing"
}

$(document).ready(function () {
    logout();
    initFirebase();
    update_calnder("RG");
    upadate_db_on_click();
});
//verify user wont have more then one meeting with the same teacher
function check_already_set_metting_with_current_teacher(teacher_list, index) {
    let flag = true;
    $.each(teacher_list[current_teacher].meeting, function (i, meeting) {
        if ((meeting.uid).localeCompare(current_user.uid) == 0 && (String(i).toString()).localeCompare(index) != 0) {
            alert("you already signed to " + full_teacher_name[current_teacher]);
            flag = false;
        }
    });
    return flag;
}
// check if user dont have duplicates at meeting times.. cant be in two places at a time...
function check_user_have_meeting_this_time(teacher_list, index) {
    let flag = true;
    $.each(teacher_list, function (i, teacher) {
        if (i.localeCompare(current_teacher) == 0) {
            return;
        }
        if ((teacher.meeting[index].uid).localeCompare(current_user.uid) == 0) {
            alert("you have meeting with " + full_teacher_name[i] + " at this time!");
            flag = false;
        }
    });
    return flag;
}
//when table click update database
function upadate_db_on_click() {
    function update(index, val_to_save) {
        firebase.database().ref('teacher_list/' + current_teacher + '/meeting/' + index).update({
            uid: val_to_save
        }).then(() => {
            update_calnder(current_teacher);
        });
    }
    $('body').on('click', '.click_meeting', function (params) {
        var rc = true;
        var clicked_row = $(this);
        var patt = /([\d]*)/i;
        let id_str = $(this).attr("id")
        var index_in_array = id_str.match(patt);
        var teacher_list_db;
        firebase.database().ref('/teacher_list/').once('value').then(
            function (snapshot) {
                teacher_list_db = snapshot.val();
            }).then(() => {
                if (($(clicked_row).attr("data-useruid")).localeCompare("None") != 0 &&
                    ($(clicked_row).attr("data-useruid")).localeCompare(current_user.uid) != 0) {
                    return;
                }
                rc = check_already_set_metting_with_current_teacher(teacher_list_db, index_in_array[0]) && rc;
                if (rc == false) return;
                rc = check_user_have_meeting_this_time(teacher_list_db, index_in_array[0]) && rc;
            }).then(() => {
                var upload_value;
                if (rc == true) {
                    if (($(clicked_row).attr("data-useruid")).localeCompare("None") == 0) {
                        update(index_in_array[0], current_user.uid);
                    } else if (($(clicked_row).attr("data-useruid")).localeCompare(current_user.uid) == 0) {
                        update(index_in_array[0], "None");
                    }
                }
            });
    });
}
//called when select diffrent teacher at selectBar.
$('#teacher_select').on('change', function () {
    current_teacher = $(this).val();
    update_calnder($(this).val());
});

function logout() {
    var logout = document.getElementById("logoutBTN");
    logout.addEventListener("click", function logout() {
        firebase.auth().signOut();
        window.location.replace("login.html");
    });
}

function build_calender(teacher_arr) {
    $("#loader").hide();
    $("#meeting_list").empty();
    $.each(teacher_arr, function (i, value) {
        let display_value_at_table
        if (value.uid == "None") {
            display_value_at_table = "Free"
        } else if (value.uid.localeCompare(current_user.uid) == 0) {
            display_value_at_table = "Occupied by me"
        }
        else {
            display_value_at_table = "Occupied"
        }
        $("#meeting_list").append(
            "   <tr>" +
            "   <th id='" + i + "h" + "' scope='row'>" + value.time + "</th>" +
            "   <td class='click_meeting' data-useruid='" + value.uid + "' id='" + i + "d" + "' colspan='5'>" + display_value_at_table + "</td>" +
            " </tr>"
        );
        let row_at_table = $("#meeting_list").find("tr");
        let index = 0;
        $.each($(row_at_table), function (i, val) {
            if ($(val).find("#" + index + "d").text().localeCompare("Free") == 0) {
                // $(val).css('background-color', '#18a103');
            } else if ($(val).find("#" + index + "d").text().localeCompare("Occupied by me") == 0) {
                $(val).css('background-color', '#18a103');
            }
            else {
                $(val).css('background-color', '#fd0303');

            }
            index += 1;
        })
    });
}

function update_calnder(name_teacher) {
    var teacher_arr;
    firebase.database().ref('/teacher_list/' + name_teacher + "/meeting").once('value').then(
        function (snapshot) {
            teacher_arr = snapshot.val();
        }).then(() => {
            build_calender(teacher_arr);
        });
}

function initFirebase() {
    function greetings(userEmail) {
        var name = userEmail.substring(0, userEmail.indexOf("@"));
        user_name = name;
        document.getElementById('greet').innerHTML = "Welcome " + name + " parents!";
    }
    //create config for initialization
    const firebaseConfig = {
        apiKey: "AIzaSyCrxpBSnbxGQ5Htkxsh6BLnyjxhHTvfKdM",
        authDomain: "web-project-12345.firebaseapp.com",
        databaseURL: "https://web-project-12345.firebaseio.com",
        projectId: "web-project-12345",
        storageBucket: "web-project-12345.appspot.com",
        messagingSenderId: "797401562503",
        appId: "1:797401562503:web:3a2c7949233f565a62e722",
        measurementId: "G-B2NCF39XYP"
    };

    //Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    //Check if user is already signed in
    firebase.auth().onAuthStateChanged(function (user) {
        current_user = user;
        if (!user) {    // No user is signed in.
            window.location.replace("login.html");
        }
        else {
            greetings(current_user.email);
        }
    });
}

//quick FireBase builder
function build_empty_datababe() {
    var teachers = ["RG", "JT", "CB", "DRG", "DRB", "PB", "MH", "MG"];
    var data = [
        { 'time': '15:00', 'uid': 'None' },
        { 'time': '15:15', 'uid': 'None' },
        { 'time': '15:30', 'uid': 'None' },
        { 'time': '15:45', 'uid': 'None' },
        { 'time': '16:00', 'uid': 'None' },
        { 'time': '16:15', 'uid': 'None' },
        { 'time': '16:30', 'uid': 'None' },
        { 'time': '16:45', 'uid': 'None' },
        { 'time': '17:00', 'uid': 'None' },
        { 'time': '17:15', 'uid': 'None' },
        { 'time': '17:30', 'uid': 'None' },
        { 'time': '17:45', 'uid': 'None' },
        { 'time': '18:00', 'uid': 'None' },
        { 'time': '18:15', 'uid': 'None' },
        { 'time': '18:30', 'uid': 'None' },
        { 'time': '18:45', 'uid': 'None' },
        { 'time': '19:00', 'uid': 'None' },
        { 'time': '19:15', 'uid': 'None' },
        { 'time': '19:30', 'uid': 'None' },
        { 'time': '19:45', 'uid': 'None' }
    ]
    for (let i = 0; i < teachers.length; i++) {
        firebase.database().ref('teacher_list/' + teachers[i]).set({
            meeting: data
        });
    }
}
