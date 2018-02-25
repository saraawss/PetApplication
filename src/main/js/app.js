'use strict';


const React = require('react');
const ReactDOM = require('react-dom')
const when = require('when');
const client = require('./client');

const follow = require('./follow'); // function to hop multiple links by "rel"

const root = '/api';

class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {pets: [], owners: [], attributes: [], attributesowner: [], pageSize: 5, links: {}, pageSizeOwner: 5, linksOwner: {}, ownerbyid: ''};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.onNavigateOwner = this.onNavigateOwner.bind(this);
	}

	// tag::follow-2[]
	loadFromServer(pageSize) {
		follow(client, root, [
			{rel: 'pets', params: {size: pageSize}}]
		).then(petCollection => {
			return client({
				method: 'GET',
				path: petCollection.entity._links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
				this.schema = schema.entity;
				this.links = petCollection.entity._links;
				return petCollection;
			});
		}).then(petCollection => {
			return petCollection.entity._embedded.pets.map(pet =>
					client({
						method: 'GET',
						path: pet._links.self.href
					})
			);
		}).then(petPromises => {
			return when.all(petPromises);
		}).done(pets => {
			this.setState({
				pets: pets,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}
	// end::follow-2[]
	
	// tag::follow-3[]
	loadOwnerFromServer(pageSizeOwner) {
		follow(client, root, [
			{rel: 'owners', params: {size: pageSizeOwner}}]
		).then(ownerCollection => {
			return client({
				method: 'GET',
				path: ownerCollection.entity._links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
				this.schema = schema.entity;
				this.links = ownerCollection.entity._links;
				return ownerCollection;
			});
		}).then(ownerCollection => {
			return ownerCollection.entity._embedded.owners.map(owner =>
					client({
						method: 'GET',
						path: owner._links.self.href
					})
			);
		}).then(ownerPromises => {
			return when.all(ownerPromises);
		}).done(owners => {
			this.setState({
				owners: owners,
				attributesowner: Object.keys(this.schema.properties),
				pageSizeOwner: pageSizeOwner,
				linksOwner: this.links
			});
		});
	}
	// end::follow-3[]

	// tag::create[]
	onCreate(newPet) {
		var self = this;
		follow(client, root, ['pets']).then(response => {
			return client({
				method: 'POST',
				path: response.entity._links.self.href,
				entity: newPet,
				headers: {'Content-Type': 'application/json'}
			})
		}).then(response => {
			return follow(client, root, [{rel: 'pets', params: {'size': self.state.pageSize}}]);
		}).done(response => {
			if (typeof response.entity._links.last != "undefined") {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
			this.loadFromServer(this.state.pageSize);
		});
	}
	// end::create[]

	// tag::update[]
	onUpdate(pet, updatedPet) {
		client({
			method: 'PUT',
			path: pet.entity._links.self.href,
			entity: updatedPet,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': pet.headers.Etag
			}
		}).done(response => {
			this.loadFromServer(this.state.pageSize);
		}, response => {
			if (response.status.code === 412) {
				alert('DENIED: Unable to update ' +
					pet.entity._links.self.href + '. Your copy is stale.');
			}
		});
	}
	// end::update[]

	// tag::delete[]
	onDelete(pet) {
		client({method: 'DELETE', path: pet.entity._links.self.href}).done(response => {
			this.loadFromServer(this.state.pageSize);
		});
	}
	// end::delete[]

	// tag::navigate[]
	onNavigate() {
		client({
			method: 'GET'
		}).then(petCollection => {
			this.links = petCollection.entity._links;

			return petCollection.entity._embedded.pets.map(pet =>
					client({
						method: 'GET',
						path: pet._links.self.href
					})
			);
		}).then(petPromises => {
			return when.all(petPromises);
		}).done(pets => {
			this.setState({
				pets: pets,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}
	// end::navigate[]
	
	// tag::navigateOwner[]
	onNavigateOwner() {
		client({
			method: 'GET'
		}).then(ownerCollection => {
			this.links = ownerCollection.entity._links;

			return ownerCollection.entity._embedded.owners.map(owner =>
					client({
						method: 'GET',
						path: owner._links.self.href
					})
			);
		}).then(ownerPromises => {
			return when.all(ownerPromises);
		}).done(owners => {
			this.setState({
				owners: owners,
				attributesowner: Object.keys(this.schema.properties),
				pageSizeOwner: this.state.pageSizeOwner,
				linksOwner: this.links
			});
		});
	}
	// end::navigateOwner[]

	// tag::update-page-size[]
	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}
	// end::update-page-size[]

	// tag::follow-1[]
	componentDidMount() {
		this.loadFromServer();
		this.loadOwnerFromServer();
	}
	// end::follow-1[]

	render() {
		return (
		
		<div className="container">
		  <h2 className="mt-5 mb-3">Pet Management System</h2>
		  
		  <div className="card border-secondary">
		      <div className="card-header">Owner Details</div>
		      <div className="card-body text-secondary">
				<OwnerList owners={this.state.owners}
							  links={this.state.links}
							  attributesowner={this.state.attributesowner}
							  onNavigateOwner={this.onNavigateOwner} />
			  </div>
		    </div>
		    
		    <div className="card border-secondary mt-3 mb-3">
		      <div className="card-header"> <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/> </div>
		    </div>
		    <div className="card border-secondary mt-3">
		      <div className="card-header">Pet Details</div>
		      <div className="card-body text-secondary">
		      	<PetList pets={this.state.pets}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
							  attributes={this.state.attributes}
							  onNavigate={this.onNavigate}
							  onUpdate={this.onUpdate}
							  onDelete={this.onDelete}
							  updatePageSize={this.updatePageSize}/>
		      </div>
		  </div>
		</div>
		
			
		)
	}
}

// tag::create-dialog[]
class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		var newPet = {};
				
		newPet["name"] = ReactDOM.findDOMNode(this.refs["name"]).value.trim();
		newPet["dob"] = ReactDOM.findDOMNode(this.refs["dob"]).value.trim();
		newPet["owner_id"] = ReactDOM.findDOMNode(this.refs["owner_id"]).value.trim();
		
		this.props.onCreate(newPet);
		
		window.location = "#";
	}

	render() {
	
		var inputs = <div> 
					 <p key="name"> Name : <input type="text" placeholder="name" ref="name" className="field" /> </p>
		             <p key="dob"> Date of Birth : <input type="date" placeholder="dob" ref="dob" className="field" /> </p>
		             <p key="owner_id"> Owner : 
			             <select ref="owner_id">
						  <option value="1">Frodo Baggins</option>
						  <option value="2">Bilbo Baggins</option>
						  <option value="3">Gandalf the Grey</option>
						  <option value="4">Samwise Gamgee</option>
						  <option value="5">Meriadoc Brandybuck</option>
						  <option value="6">Peregrin Took</option>
						  
						</select>
					</p>
		             </div>;
		
		
		
		return (
			<div>
				<a href="#createPet">Create a Pet</a>

				<div id="createPet" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new pet</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}
};
// end::create-dialog[]

// tag::update-dialog[]
class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		var updatedPet = {};
		/*
		this.props.attributes.forEach(attribute => {
			updatedPet[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		*/
		
		updatedPet["name"] = ReactDOM.findDOMNode(this.refs["name"]).value.trim();
		updatedPet["dob"] = ReactDOM.findDOMNode(this.refs["dob"]).value.trim();
		updatedPet["owner_id"] = ReactDOM.findDOMNode(this.refs["owner_id"]).value.trim();
		
		this.props.onUpdate(this.props.pet, updatedPet);
		window.location = "#";
	}

	render() {
		
		
		var inputs = <div>
						<p key={this.props.pet.entity["name"]}>
							<input type="text" defaultValue={this.props.pet.entity["name"]} ref={"name"} className="field" />
					     </p>
					     <p key={this.props.pet.entity["dob"]}>
							<input type="date" defaultValue={this.props.pet.entity["dob"]} ref={"dob"} className="field" />
					     </p>
					     <p key={this.props.pet.entity["owner_id"]}>
					     	<select defaultValue={this.props.pet.entity["owner_id"]} ref={"owner_id"}>
							  <option value="1">Frodo Baggins</option>
							  <option value="2">Bilbo Baggins</option>
							  <option value="3">Gandalf the Grey</option>
							  <option value="4">Samwise Gamgee</option>
							  <option value="5">Meriadoc Brandybuck</option>
							  <option value="6">Peregrin Took</option>
							</select>
						</p>
					</div>;

		var dialogId = "updatePet-" + this.props.pet.entity._links.self.href;

		return (
			<div key={this.props.pet.entity._links.self.href}>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Update a pet</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

};
// end::update-dialog[]


class PetList extends React.Component {

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}

	// tag::handle-page-size-updates[]
	handleInput(e) {
		e.preventDefault();
		var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
		}
	}
	// end::handle-page-size-updates[]

	// tag::handle-nav[]
	handleNavFirst(e){
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}
	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}
	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}
	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}
	// end::handle-nav[]
	// tag::pet-list-render[]
	render() {
		var pets = this.props.pets.map(pet =>
				<Pet key={pet.entity._links.self.href}
						  pet={pet}
						  attributes={this.props.attributes}
						  onUpdate={this.props.onUpdate}
						  onDelete={this.props.onDelete}/>
		);

		var navLinks = [];
		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
		}
		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
		}
		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
		}

		return (
			<div>
							
				<table className="table table-striped">
					<thead>
						<tr>
							<th scope="col">Name</th>
							<th scope="col">DOB</th>
							<th scope="col">Owner Id</th>
							<th scope="col"></th>
							<th scope="col"></th>
						</tr>
					</thead>	
					<tbody>
						{pets}
					</tbody>
				</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}
	// end::pet-list-render[]
}

// tag::pet[]
class Pet extends React.Component {

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
		
		this.state = {
	      ownerbyids: []
	    };
	}

	handleDelete() {
		this.props.onDelete(this.props.pet);
	}
	
	
	render() {
		
		return (
			<tr>
				<td>{this.props.pet.entity.name}</td>
				<td>{this.props.pet.entity.dob}</td>
				<td>{this.props.pet.entity.owner_id}</td>
				<td>
					<UpdateDialog pet={this.props.pet}
								  attributes={this.props.attributes}
								  onUpdate={this.props.onUpdate}/>
				</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}
// end::pet[]

class OwnerList extends React.Component {

	constructor(props) {
		super(props);
		
	}

	
	// tag::owner-list-render[]
	render() {
		var owners = this.props.owners.map(owner =>
						<Owner key={owner.entity._links.self.href}
						  owner={owner}
						  attributesowner={this.props.attributesowner}/>
		);
		


		return (
			<div>
				
				<table className="table table-striped">
					<thead>
						<tr>
							<th scope="col">First Name</th>
							<th scope="col">Last Name</th>
							<th scope="col">City</th>
						</tr>
					</thead>	
					<tbody>	
						{owners}
					</tbody>
				</table>
				
			</div>
		)
	}
	// end::owner-list-render[]
}

// tag::owner[]
class Owner extends React.Component {

	constructor(props) {
		super(props);
	}

	

	render() {
		return (
			<tr>
				<td>{this.props.owner.entity.firstName}</td>
				<td>{this.props.owner.entity.lastName}</td>
				<td>{this.props.owner.entity.city}</td>
				
			</tr>
		)
	}
}
// end::owner[]


ReactDOM.render(
	<App />,
	document.getElementById('react')
)
