var Handlebars = require('handlebars'),
    fs = require('fs');

var templates = {
    form: fs.readFileSync('./templates/form.hbs'),
    fieldset: fs.readFileSync('./templates/fieldset.hbs'),
    field: fs.readFileSync('./templates/field.hbs'),
    field_errors: fs.readFileSync('./templates/errors.hbs'),
    text: fs.readFileSync('./templates/input_text.hbs'),
    email: fs.readFileSync('./templates/input_text.hbs'),
    date: fs.readFileSync('./templates/input_date.hbs'),
    select: fs.readFileSync('./templates/input_select.hbs'),
    password: fs.readFileSync('./templates/input_text.hbs'),
    checkbox: fs.readFileSync('./templates/input_checkbox.hbs'),
    textarea: fs.readFileSync('./templates/textarea.hbs')
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
