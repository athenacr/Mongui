# Mongui
## Mongui is a graphical interface for viewing and (eventually) editing data in a Mongo DB.
Mongui has a client/server architecture that relies on severaly open-source frameworks that are widely used.

## Setup
{% highlight bash %}
rvm 1.8.7@mongui --create;
gem install bundler;
# Reload your .bashrc file, or just restart your terminal
bundle install;
{% endhighlight %}

## Server
The server is built off of the *Sinatrarb framework*: [http://www.sinatrarb.com/](http://www.sinatrarb.com/)

## Requirements
The following ruby gems are required to run the server:

*Required Gems:*
- bson (1.0)
- json (1.4.3, 1.2.0)
- mongo (1.0, 0.19.1)
- rack (1.1.0)
- sinatra (1.0, 0.9.4)
- bson_ext (1.0)
- yajl-ruby (0.7.5)

*Optional gems:*
- mongo_ext (0.19.1)
- thin (1.2.7)

### Driver File:
By default, the server connects to `localhost`. To override this add a file named 'mongo_hosts.dat' in the same directory as `mongui.rb`.
The file should contain the address of all your Mongo DBs. One per line.

##### Running the server:
This will run the server on port `4567`

{% highlight bash %}
ruby mongui.rb 
{% endhighlight %}
Enjoy, at [http://localhost:4567/](http://localhost:4567/)

Run Mongui on a different port. See the Sinatra link above for more server options.
{% highlight bash %}
ruby mongui.rb -p <PORT>
{% endhighlight %}

## Client
The *ExtJS* framework is required to run the client, but is not included with the repo. 
It can be found here: [http://www.sencha.com/products/extjs/](http://www.sencha.com/products/extjs/)

- Download and unzip the framework.
- Rename the `ext-3.2.1` directory '`extjs`' and place it in the `Mongui/public/lib` directory.

### Running the client:
Point your browser to `http://localhost:4567/mongui.html` after you have the server running. 
If you used the '`-p`' option when running the server you will need to change the port accordingly.

### Usage:
If all is well so far you will see a three-paned webpage appear. 
Left-pane, a drill down of `Host/DB/Collection`. Drill down and double click a selection.
Double-clicking takes you to the the 'Collection Data' tab which shows you a few documents from your collection.
To run a query, enter it in the upper pane and press '`Run Query`'. This will change your view to the '`Results`' tab and show you your data.

#### Hot-Keys:
- `CTRL R` - Run Query
- `CTRL T` - New Query Tab

# You did it!
