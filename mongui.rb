require 'rubygems'
require 'mongo'
require 'sinatra'
require 'time'
require 'yajl/json_gem'

HOST_DATA_FILE = 'mongo_hosts.dat'

def get_hosts
    if File.exists? HOST_DATA_FILE
        return File.open(HOST_DATA_FILE,'r').readlines.collect{ |host| host.strip }
    else
        return ['localhost']
    end
end

HOSTS = get_hosts

post '/show_dbs' do
    
    
    counter = 1
    data = []
    
    HOSTS.each do |host|
        m = Mongo::Connection.new( host,
                                   27017, #Todo: port should be in the host data file
                                   :slave_ok => true)
        

        host_node = {}
        host_node[:id] = counter
        counter += 1
        host_node[:text] = host
        host_node[:icon] = 'images/blue.gif'
        host_node[:children] = []

        m.database_names.each do |db_name|

            db = m.db(db_name)
            
            db_node = {}
            db_node[:id] = counter
            counter += 1
            db_node[:text] = db_name
            db_node[:icon] = 'images/db.gif'
            db_node[:children] = []

            db.collection_names.each do |coll_name|
                coll_node = {}
                coll_node[:id] = counter
                counter += 1
                coll_node[:text] = coll_name
                coll_node[:leaf] = true
                db_node[:children] << coll_node
            end
            if db_node[:children].size == 0
                db_node[:leaf] = true
            end
            host_node[:children] << db_node
        end
        data << host_node
        m.close
    end

    return JSON.pretty_generate(data)
end


post '/query' do

    query = nil

    query = JSON.parse(params['query']) if params.has_key?('query')

    m = Mongo::Connection.new( params['host'],
                               27017,
                               :slave_ok => true).db(params['db']).collection( params['coll'])
    rval = []
    if query == nil
        rval = m.find().limit(100).to_a 
    else
        rval =  m.find(query).limit(100).to_a 
    end

    return JSON.pretty_generate(rval) if rval.size
    return ""
end

post '/stats' do
 m = Mongo::Connection.new( params['host'],
                               27017,
                               :slave_ok => true).db(params['db']).collection( params['coll'])
    return JSON.pretty_generate(m.stats)
end


