Forms &amp; Fields
====

A module to help the rendering of forms and their respective fields.

May eventually be deprecated by https://github.com/powmedia/backbone-forms
but for now, it's built and works :-)

Form
===

The `Form` module provides helpers to easily iterate over a forms fields or
fieldsets. Additionally, the form is in charge of validation, keeping the view
lean.

The form is rendered via a simple, but flexible field schema that looks
something like this:

    form_dict: {
        title: "ProfileForm",
        fields: {
            first_name: {
                title: "first_name",
                required: true,
                label: "First Name",
                error_messages: {
                    required: "This field is required",
                    invalid: "Enter a valid value."
                },
                min_length: null,
                max_length: 50,
                widget: {
                    title: "first_name",
                    input_type: "text"
                }
            }
        }
    }
    

For the most basic form which provides validation on the schema with a
server-side endpoint and renders a bunch of fields. First, define it:

    var ProfileForm = Form.extend({
        validateUrl: '/validation/endpoint'
    });


Then, use it in a Backbone view.

    var ProfileView = Backbone.View.extend({
        events: {
            "click #save": "validate"
        },

        initialize: function(options) {
            this.form = new ProfileForm({
                schema: this.options.schema
            });
        },

        validate: function() {
            var that = this;
            this.form.validate(function(form) {
                if (form.success) {
                    that.model.save();
                }
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.$('.form-block').html(this.form.render().el);
            return this;
        }
    });

Backbone.stickit
====

The form places nice with [backbone.stickit](http://nytimes.github.com/backbone.stickit/), allowing any changes in the form to be bound to the model, and many other cool things, check it out! An example, using the same `ProfileForm` as before.

    var myForm = new ProfileForm({
        schema: this.options.schema,
        bindingOptions: {
            model: this.model,
            exclude: ['last_name'],
        }
    });

As long as you pass `bindings.model`, the form will attempt to bind any changes
in the form to those model fields. The form currently supports a special
attribute on the `widget` of a field, to adjust the binding, in case your
Backbone model is not a 1:1 relationship with your form:

    widget: {
        title: "first_name",
        input_type: "text",
        attrs: {
            data-binding: "name_first"
        }
    }

Test
===

    npm install -D
    npm test
