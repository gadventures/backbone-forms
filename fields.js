var _ = require('lodash'),
    Handlebars = require('./handlebars'),
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
    _bindTo: function(model, dateType) {
        var field = this.field;

        var dateTypeIndex = ['year', 'month', 'day'].indexOf(dateType);

        var collection = _.find(field.widget.choices, function(choice) {
            return choice.title === dateType;
        }).data;

        // On initial values, we need to create a blank placeholder date.
        var makeBlankDate = function(value, index) {
            return _(3).times(function(n) {
                if (n === index) {
                    return value;
                } else {
                    return "-";
                }
                return;
            }).join("");
        };

        return {
            observe: field.binding,
            selectOptions: {
                collection: function() { return collection; },
                labelPath: 'value',
                valuePath: 'key'
            },
            onSet: function(value, options) {
                if (!value) {
                    return;
                }
                var existingDate = model.get(field.binding);
                if (!existingDate) {
                    existingDate = makeBlankDate(value, dateTypeIndex);
                }
                var dateItems = existingDate.split('-');
                return _.reduce(dateItems, function(memo, item, index) {
                    if (index === dateTypeIndex) {
                        memo.push(value);
                    } else {
                        memo.push(item);
                    }
                    return memo;
                }, []).join('-');
            },
            onGet: function(value, options) {
                if (!value) {
                    return;
                }
                var dateItems = value.split('-');
                if (!dateItems[dateTypeIndex]) {
                    return;
                }
                return dateItems[dateTypeIndex];
            }
        };
    },

    getBindingContext: function(model) {
        var context = {};
        context['#' + this.field.key + '_day'] = this._bindTo(model, 'day');
        context['#' + this.field.key + '_month'] = this._bindTo(model, 'month');
        context['#' + this.field.key + '_year'] = this._bindTo(model, 'year');
        return context;
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
