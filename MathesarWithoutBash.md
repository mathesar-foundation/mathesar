
***Documentation for running Mathesar without the bash script***<br/>
<br/>
The steps to run Mathesar without the bash script:<br/>
<br/>
1.Clone the Mathesar repository:
```
git clone https://github.com/centerofci/mathesar.git
```
2.Install the dependencies:
```
cd mathesar
pip install -r requirements.txt
```
3.Initialize the database:
```
python manage.py migrate
```
4.Create a superuser:
```
python manage.py createsuperuser
```
5.Start the development server:
```
python manage.py runserver
```
6.Open a web browser and navigate to http://localhost:8000/. <br/>
You should see the Mathesar homepage.<br/>
<br/>
7.Log in with the superuser credentials you created in step 4.<br/>

That wraps it up! It is expected that you will be able to utilise Mathesar even without the bash script now. It is important to keep in mind that in order to use Mathesar in a production setting, you will need to implement the necessary safety precautions and think about taking additional steps, such as using a database backend that is ready for production and making the necessary configuration adjustments. additional steps, such as using a production-ready database backend and setting appropriate configuration settings.
<br/>

 MadhukeshSingh/mathesar 
