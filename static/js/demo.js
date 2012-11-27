$(document).ready(function() {
    alert(getEvents());

    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    var calendar = $('#calendar').fullCalendar({
        theme: true,
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        editable: true,
        selectable: true,
        selectHelper: true,
        select: function(start, end, allDay) {
            var title = prompt('Event Title:');
            if (title) {
                calendar.fullCalendar('renderEvent',
                    {
                        title: title,
                        start: start,
                        end: end,
                        allDay: allDay
                    },
                    true // make the event "stick"
                );
                // add to database AJAX
            }
            calendar.fullCalendar('unselect');
        },
        events: [
            {
                title: 'All Day Event',
                start: new Date(y, m, 1)
            },
            {
                title: 'Long Event',
                start: new Date(y, m, d-5),
                end: new Date(y, m, d-2)
            },
            {
                id: 999,
                title: 'Repeating Event',
                start: new Date(y, m, d-3, 16, 0),
                allDay: false
            },
            {
                id: 999,
                title: 'Repeating Event',
                start: new Date(y, m, d+4, 16, 0),
                allDay: false
            },
            {
                title: 'Meeting',
                start: new Date(y, m, d, 10, 30),
                allDay: false
            },
            {
                title: 'Lunch',
                start: new Date(y, m, d, 12, 0),
                end: new Date(y, m, d, 14, 0),
                allDay: false
            },
            {
                title: 'Birthday Party',
                start: new Date(y, m, d+1, 19, 0),
                end: new Date(y, m, d+1, 22, 30),
                allDay: false
            },
            {
                title: 'Click for Google',
                start: new Date(y, m, 28),
                end: new Date(y, m, 29),
                url: 'http://google.com/'
            }
        ],
        eventClick: function(calEvent, jsEvent, view) {
            var $settings = $("#settings");
            $settings.dialog({
                title: calEvent.title,
                width: 400,
                draggable: false,
                resizable: false,
                close: function() {
                    $settings.dialog("destroy");
                    $settings.hide();
                },
                buttons: {
                    'Save Changes' : function() {
                        $settings.dialog("close");
                    }
                }
            }).show();
        }
    });

   var $settings = $("#settings");

   $("#settings_button").click(function() {
      $settings.dialog({
         title: "This is the settings page",
         width: 400,
         draggable: false,
         resizable: false,
         close: function() {
            $settings.dialog("destroy");
            $settings.hide();
         },
         buttons: {
            'Save Changes' : function() {
               $settings.dialog("close");
            }
         }
      }).show();
   });


});

function getEvents() {
    // ajax request to django server for data
    $.ajax(
        {
            //The request type is set to GET, alternatively, it could be POST if we were passing data.
            type:"GET",
            //The url is set to our request path.
            url:'get_events',
            //Datatype set to "json"
            dataType: "json",

            //Next, once the request is successful, the following function is called, and a json response is returned and held in the (temp) variable data.
            success: function (data)
            {
                var events = JSONtoEVENTS(data);
                alert(events);
                return(events);
            }
        });
}

function JSONtoEVENTS (json) {
    // array to hold event objects
    var events = [];

    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();


    for (var index in json) {
        var event = {
            id: 999,
            title: 'Repeating Event',
            start: new Date(y, m, d-3, 16, 0),
            allDay: false
        };
        events.push(event);
    }
    return events;
}