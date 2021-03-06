var $ = require('jquery'),
    _ = require('underscore'),
    Handlebars = require('./handlebars'),
    Backbone = require('backbone'),
    logger = require('bows')('forms'),
    fields = require('./fields');

var Fieldset = Backbone.View.extend({
    template: Handlebars.templates.fieldset,

    initialize: function(options) {
        options = (options || {});
        _.bindAll.apply(_, [this].concat(_.functions(this)));
        var self = this;

        this.fieldset = options.fieldset;
    },
    getContextData: function() {
        return this.fieldset;
    },
    render: function() {
        var fieldset = this.template(this.getContextData());
        this.setElement(fieldset);
        return this;
    }
});

var Form = Backbone.View.extend({
    template: Handlebars.templates.form,
    fieldsetClass: Fieldset,

    initialize: function(options) {
        options = (options || {});
        _.bindAll(this, '_setSchema', 'renderFieldSet');
        var self = this;

        if (_.isEmpty(options.schema)) {
            throw new Error("You must pass a schema. See README");
        }

        this.validateUrl = (_.result(options, 'validateUrl') || _.result(this, 'validateUrl'));
        this.schema = this._setSchema(options.schema);

        this.bindings = {};
        this.bindingOptions = options.bindingOptions || null;

        // A model can be passed when preparing a binding. Each field will
        // be bound as they are created.
        if (this.bindingOptions) {
            this.model = this.bindingOptions.model || null;
        } else {
            this.bindingOptions = {};
        }

        this.fields = this._initializeFields();

        // State handlers.
        this.success = false;
    }
});

_.extend(Form.prototype, {
    // Bind all fields to instances. Any time we wish to iterate over the
    // fields for other purposes can be done via the initialized fieldset.
    _initializeFields: function() {
        var self = this;
        var formFields = _.extend({}, this.schema.fields);

        return _.map(formFields, function(field, index, list) {
            // Create a new instance of the field based on the widget input
            // type.
            var fieldClass = null;
            switch (field.widget.input_type) {
                case "text":
                case "textarea":
                case "password":
                case "email":
                    fieldClass = fields.TextField;
                    break;
                case "date":
                    fieldClass = fields.DateField;
                    break;
                case "select":
                    fieldClass = fields.SelectField;
                    break;
                case "checkbox":
                    fieldClass = fields.CheckboxField;
                    break;
            }

            // Attach key for easier access and binding
            // before pushing to instance.
            var widgetAttrs = field.widget.attrs;
            var binding = field.title;
            if (widgetAttrs && widgetAttrs.hasOwnProperty('data-binding')) {
                binding = widgetAttrs['data-binding'];
            }

            _.extend(field, {
                key: index,
                binding: binding
            });

            var fieldInstance = new fieldClass({
                field: field,
                handlebars: self.handlebars
            });

            self._bindField(fieldInstance);

            fieldInstance.listenTo(self, 'schema:change',
                    fieldInstance.updateFromSchema);
            return fieldInstance;
        });
    },

    // Return the appropriate field from the model for a form field.
    getModelField: function(field) {
        return this.bindings["#" + field].observe;
    },

    // Return all, or a selective list of bound fields.
    _getFields: function(fields) {
        fields = fields || _.keys(this.schema.fields);
        return _.filter(this.fields, function(instance, index, list) {
            return _.contains(fields, instance.id);
        });
    },

    /*
     * Bindings match a form element to a model field. By convention, this is
     * available as an attribute within the widget (perhaps something we can
     * adjust in the future.)
     */
    _bindField: function(fieldInstance) {
        var exclude = this.bindingOptions.exclude || [];
        if (this.model && _.indexOf(exclude, fieldInstance.id) === -1) {
            _.extend(this.bindings, fieldInstance.bindings(this.model));
        }
    },

    _setSchema: function(schema) {
        this.schema = schema;
        if (schema.errors) {
            this.success = (_.keys(schema.errors).length === 0);
        } else {
            logger("Could not identify errors in schema. Cannot reliably determine if form is successful.");
        }
        this.trigger('schema:change', this.schema);
        return schema;
    },

    // Return fields that have errors.
    errors: function() {
        var errorFields = _.keys(this.schema.errors);
        var fieldErrors = _.filter(this.fields, function(instance, key, list) {
            return _.contains(errorFields, instance.id);
        });

        return {
            all: this.schema.errors.__all__,
            fields: fieldErrors
        };
    },

    // Called when validating form, returns a data object of fields and values
    // being sent to the server for validation.
    cleaned: function() {
        var data = {};

        // TODO: Instead of iterating over the schema here, we can probably
        // get away with simply sending the model as a JSON stringify.
        _.each(this.schema.fields, function(field, key, list) {
            switch (field.widget.input_type) {
                case 'checkbox':
                    if (this.$('#' + key).is(':checked')) {
                        data[key] = this.$('#' + key).val();
                    }
                    break;
                default:
                    data[key] = this.$('#' + key).val();
            }

            // Finally, check for any hooked functions in cleaning the field.
            var cleanFunc = "clean_" + key;
            if (typeof(this[cleanFunc]) === "function") {
                data[key] = this[cleanFunc](data);
            }
        }, this);
        return data;
    },

    // Given we have full schema information, we can also do some
    // client-side, inline validation. For now, let's push it to the server
    // so we can test some Django integration.
    validate: function(callback) {
        var self = this;
        var data = this.cleaned();

        Backbone.$.ajax({
            url: this.validateUrl,
            type: 'POST',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data),
            complete: function(response) {
                var data = JSON.parse(response.responseText);
                self._setSchema(data.form_dict);
                return callback(self);
            }
        });
    },

    /*
     * Iterate over a form with a fieldset, Handlebars example:
     *
     * {{#each form.fieldsets}}
     *  <h1>{{this.legend}}</h1>
     *  <ul>
     *  {{#each this.fields}}
     *      <li>{{this.label}}, {{this.widget}}</li>
     *  {{/each}}
     *  </ul>
     * {{/each}}
     * */
    fieldsets: function() {
        var that = this;

        // If no fieldsets, define it
        if (!this.schema.fieldsets) {
            this.schema.fieldsets = [];
        }

        // If there is no fieldset defined, put all fields into it.
        if (this.schema.fieldsets.length === 0) {
            var fields = _.keys(this.schema.fields);
            this.schema.fieldsets.push({fields: fields});
        }

        return _.map(this.schema.fieldsets, function(fieldset, key, list) {
            // For any fieldset that actually has fields listed, we need to
            // update those with real fields.
            var fieldsetInstance = _.extend({}, fieldset);
            if (fieldsetInstance.hasOwnProperty('fields')) {
                _.extend(fieldsetInstance.fields, that._getFields(fieldsetInstance.fields));
            }
            return fieldsetInstance;
        });
    },

    /*
     * Iterate over a form, Handlebars example:
     *
     * {{#each form.fields}}
     *  <li>{{this.label}}, {{this.widget}}</i>
     * {{/each}
     */
    iter: function() {
        return this.fields;
    },

    render: function() {
        this.setElement(this.template());
        _.each(this.fieldsets(), this.renderFieldSet);
        return this;
    },

    renderFieldSet: function(fieldset) {
        var that = this;

        var fieldsetView = new this.fieldsetClass({
            fieldset: fieldset,
            form: this
        });

        this.$el.append(fieldsetView.render().el);

        // Fieldset is rendered, add fields to it.
        var $fieldsContainer = $('.fields-list', fieldsetView.$el);
        _.each(fieldset.fields, function(field) {
            var fieldElement = field.render().el;
            $fieldsContainer.append(fieldElement);
        });
    },

    /*
     * Return a subset of the form bindings matched with the
     * attributes of the model passed in.  This would be used if
     * we want to bind multiple models to one monolithic form
     */
    pickModelBindings: function(model) {
        var observables = {}, selectors = [];
        var modelAttribs = _.keys(model.attributes);

        // map the field selectors to their model observables
        _.each(this.bindings, function(obj, key) {
            observables[key] = obj.observe;
        });

        /*
         * Match the form observables with the model fields, looking
         * at just the top level of nested resources
         */
        var modelObservables = _.filter(observables, function(value, key) {
            return _.contains(modelAttribs, _.first(value.split('.')));
        });

        _.each(observables, function(value, key) {
            if(_.contains(modelObservables, value)) {
                selectors.push(key);
            }
        });

        var modelBindings = _.pick(this.bindings, selectors);
        return modelBindings;
    }
});

module.exports = {
    Form: Form,
    Fieldset: Fieldset
};
