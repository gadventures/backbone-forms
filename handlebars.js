/*global __dirname*/
var Handlebars = require('handlebars'),
    fs = require('fs');

var templates = {
    form: fs.readFileSync(__dirname + '/templates/form.hbs'),
    fieldset: fs.readFileSync(__dirname + '/templates/fieldset.hbs'),
    field: fs.readFileSync(__dirname + '/templates/field.hbs'),
    field_errors: fs.readFileSync(__dirname + '/templates/errors.hbs'),
    text: fs.readFileSync(__dirname + '/templates/input_text.hbs'),
    email: fs.readFileSync(__dirname + '/templates/input_text.hbs'),
    date: fs.readFileSync(__dirname + '/templates/input_date.hbs'),
    select: fs.readFileSync(__dirname + '/templates/input_select.hbs'),
    password: fs.readFileSync(__dirname + '/templates/input_text.hbs'),
    checkbox: fs.readFileSync(__dirname + '/templates/input_checkbox.hbs'),
    textarea: fs.readFileSync(__dirname + '/templates/textarea.hbs')
};

// Store compiled templates.
if (typeof Handlebars.templates === "undefined") {
    Handlebars.templates = {};
}

Handlebars.registerHelper('renderWidget', function() {
    var fieldTemplate = Handlebars.templates[this.widget.input_type];
    return new Handlebars.SafeString(fieldTemplate(this));
});

for (var key in templates) {
    Handlebars.templates[key] = Handlebars.compile(String(templates[key]));
}

module.exports = Handlebars;
