from rest_framework import serializers
from .models import Employee
from organisation.models import Organisation

class EmployeeSerializer(serializers.ModelSerializer):
    organisation = serializers.PrimaryKeyRelatedField(queryset=Organisation.objects.all(), required=False)

    class Meta:
        model = Employee
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'invited_at', 'activated_at', 'deactivated_at',
            'created_at', 'updated_at', 'organisation', 'role', 'password'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user 