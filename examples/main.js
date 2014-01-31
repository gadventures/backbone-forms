/*global document*/
var Form = require('../forms');

module.exports = {
    launch: function() {
        var schema = {
            title: "ExampleForm",
            errors: [],
            fieldsets: [
                {
                    fields: ["name", "address"],
                    legend: "Personal Information",
                    key: "personal"
                }
            ],
            fields: {
                name: {
                    title: "name",
                    required: true,
                    label: "Your Name",
                    widget: {
                        title: "name",
                        input_type: "text"
                    }
                },
                address: {
                    title: "address",
                    required: false,
                    label: "Your address",
                    widget: {
                        title: "address",
                        input_type: "text"
                    }
                }
            }
        };
        var form = new Form({
            schema: schema
        });
        document.getElementById('content').innerHTML = form.render().$el.html();
    }
};

module.exports.launch();
