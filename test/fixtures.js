var mockField = {
    key: 'foo',
    label: 'Foo',
    errors: [],
    widget: {
        input_type: 'text',
        choices: []
    }
};

var mockDateField = {
    key: 'date',
    label: 'Date',
    errors: [],
    binding: 'issue_date',
    widget: {
        input_type: 'date',
        choices: [
            {
                title: 'day',
                data: [
                    { value: 1, key: 1},
                    { value: 2, key: 2}
                ]
            },
            {
                title: 'month',
                data: [
                    { value: "January", key: 1},
                    { value: "February", key: 2}
                ]
            },
            {
                title: 'year',
                data: [
                    { value: 1992, key: 1992 },
                    { value: 1993, key: 1993 }
                ]
            }
        ]
    }
};

var mockSchema = {
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
};

module.exports = {
    mockSchema: mockSchema,
    mockDateField: mockDateField,
    mockField: mockField
};
