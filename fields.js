var _ = require('lodash'),
    Handlebars = require('./handlebars'),
    logger = require('bows')('fields'),
    Backbone = require('backbone');

var Field = Backbone.View.extend({
    tagName: 'li',
    errorSelector: '.field-errors',
    initialize: function(options) {
        _.bindAll(this);

        this.field = options.field;
        this.id = this.field.key;

        this.templates = {
            field: Handlebars.templates.field,
            errors: Handlebars.templates.field_errors
        };
    },

    getContextData: function() {
        var context = this.field;
        return context;
    },

    updateFromSchema: function(schema) {
        this.field.errors = schema.errors[this.id] || [];
        this.renderErrors();
    },

    renderErrors: function() {
        this.$(this.errorSelector).remove();
        this.$el.append(this.templates.errors(this.getContextData()));
    },

    // Add a message to the errors for this field.
    addError: function(message) {
        if (_.indexOf(this.field.errors, message) === -1) {
            this.field.errors.push(message);
        }
    },

    validateInput: function(val, options) {
        var errorState = false;
        this.field.errors = [];

        if (this.field.required && val === "") {
            this.addError(this.field.error_messages.required);
        }

        var min_length = this.field.min_length;
        var max_length = this.field.max_length;

        if (min_length !== null && val.length < min_length) {
            this.addError('Must be atleast ' + min_length + ' characters');
        }

        if (max_length !== null && val.length > max_length) {
            this.addError('Cannot exceed ' + max_length + ' characters');
        }

        this.renderErrors();
        // Don't update the model if we have errors.
        if (errorState) {
            return false;
        }
        return true;
    },

    getBindingContext: function(model) {
        var context = {};
        context['#' + this.id] = {
            observe: this.field.binding,
            updateModel: this.validateInput,
        };
        return context;
    },

    bindings: function(model) {
        return this.getBindingContext(model);
    },

    render: function() {
        var $field = this.templates.field(this.getContextData());
        this.$el.html($field);
        this.renderErrors();
        return this;
    }
});

var DateField = Field.extend({
    date: {
        day: null,
        year: null,
        month: null
    },

    dateAsString: function() {
        return [
            this.date.year,
            this.date.month,
            this.date.day
        ].join("-");
    },

    bindings: function(model) {
        var bindings = Field.prototype.bindings.call(this, model);

        // Watch for this trigger. It can be fired off whenever updateLocalDate
        // is set, and all parts of the date are ready to be set on the model.
        this.on("setModel", function() {
            logger("Setting model", this.dateAsString());
            model.set(this.field.binding, this.dateAsString());
        });

        this.setLocalDate(model);

        return bindings;
    },

    // Set the local date from the model field.
    setLocalDate: function(model) {
        var val = model.get(this.field.binding);

        if (_.isUndefined(val)) return;
        if (_.isNull(val)) return;

        var parts = val.split("-");
        this.date = {
            year: parts[0],
            month: parts[1],
            day: parts[2]
        };
    },

    updateLocalDate: function(type, value) {
        this.date[type] = value;

        var valid = _.reject(this.date, function(val) {
            return val === "" || _.isNull(val);
        });

        // All parts of the date are valid. Set that model.
        if (valid.length === 3) {
            this.trigger("setModel");
        }
    },

    onSelectChange: function(ev) {
        var $target = this.$("#" + ev.currentTarget.id);
        var type = $target.data("type");
        this.updateLocalDate(type, $target.val());
    },


    // Along with our regular binding, we need to bind the year, day, and month
    // fields to our own tracking, setting our actual model-bound field to a new
    // value whenever all select boxes are valid.
    render: function() {
        Field.prototype.render.call(this, arguments);

        // Set the rendered elements with their values.
        if (this.date.day) this.$("#" + this.field.key + "_day").val(this.date.day);
        if (this.date.year) this.$("#" + this.field.key + "_year").val(this.date.year);
        if (this.date.month) this.$("#" + this.field.key + "_month").val(this.date.month);

        this.$("#" + this.field.key + "_day").change(this.onSelectChange);
        this.$("#" + this.field.key + "_month").change(this.onSelectChange);
        this.$("#" + this.field.key + "_year").change(this.onSelectChange);

        return this;
    }
});

var SelectField = Field.extend({
    getBindingContext: function(model) {
        var context = {};
        var collection = this.field.widget.choices;

        context['#' + this.field.key] = {
            observe: this.field.binding,
            selectOptions: {
                collection: function() {
                    return collection;
                },
                labelPath: 'display',
                valuePath: 'value'
            }
        };
        return context;
    }
});

var TextField = Field;
var CheckboxField = Field;

module.exports = {
    TextField: TextField,
    DateField: DateField,
    SelectField: SelectField,
    CheckboxField: CheckboxField
};
