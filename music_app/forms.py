from django import forms
from django.contrib.auth.forms import UserCreationForm

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError



class RegistVerificationForm(forms.Form):
    # print(11111111111111111)
    # email = forms.EmailField()
    email = forms.EmailField(label='email', max_length=100)
    print('email',email)
    password = forms.CharField(label='password', max_length=100, widget=forms.PasswordInput)
    print('password',password)

    ticket = forms.CharField(label='ticket', max_length=1000)
    randstr = forms.CharField(label='randstr', max_length=1000)
    errorCode = forms.IntegerField(label='errorCode')
    errorMessage = forms.CharField(label='errorMessage', max_length=100)

    # print(222222222222222222)

class LogInForm(forms.Form):
    # print(11111111111111111)
    # email = forms.EmailField()
    email = forms.EmailField(label='email', max_length=100)
    print('email',email)
    password = forms.CharField(label='password', max_length=100, widget=forms.PasswordInput)
    print('password',password)
    # print(222222222222222222)

class ForgetPasswordForm(forms.Form):
    email = forms.EmailField(label='email', max_length=100)

class ConfirmPasswordForm(forms.Form):
    # print(11111111111111111)
    # email = forms.EmailField()
    code = forms.CharField(label='code', max_length=100)
    password = forms.CharField(label='password', max_length=100, widget=forms.PasswordInput)

class RegistConfirmForm(forms.Form):
    code = forms.CharField(label='code', max_length=100)
    # confirm_password = forms.CharField(label='Confirm password', widget=forms.PasswordInput)

class DescribeCreatForm(forms.Form):
    # print(0000000000)
    describe_text = forms.CharField(label='describe_text', max_length=100)
    print(describe_text)
    describe_time = forms.CharField(label='describe_time', max_length=100)
    describe_drop = forms.CharField(label='describe_drop', max_length=100)

class AddMusicForm(forms.Form):
    # print(0000000000)
    user_id = forms.CharField(label='user_id', max_length=50, required=True)
    title = forms.CharField(label='title', max_length=100, required=True)
    score = forms.CharField(label='score', max_length=20, required=False)
    # path = forms.CharField(label='path', max_length=100, required=True)
    play_time = forms.CharField(label='play_time', max_length=100, required=False)
    # save_id = forms.CharField(label='save_id', max_length=100, required=False)
    algo_type = forms.CharField(label='algo_type', max_length=100, required=False)
    start_time = forms.FloatField(label='start_time', required=False)
    end_time = forms.FloatField(label='end_time', required=False)
    instrument_type = forms.CharField(label='algo_type', max_length=100, required=False)
    # create_time = forms.CharField(label='create_time', max_length=100)

class DelMusicForm(forms.Form):
    music_id = forms.CharField(label='music_id', max_length=50, required=True)


