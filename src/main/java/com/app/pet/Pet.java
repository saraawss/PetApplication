package com.app.pet;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Version;

import lombok.Data;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Data
@Entity
public class Pet {

	private @Id @GeneratedValue Long id;
	private String name;
	private String dob;
	private Long owner_id;
	
	@ManyToOne(cascade = CascadeType.ALL)
	@JsonIgnore
    @JoinColumn(name = "owner_id" , insertable = false, updatable = false)
	private Owner owner;

	private @Version @JsonIgnore Long version;

	private Pet() {}

	public Pet(String name, String dob, Long owner_id) {
		this.name = name;
		this.dob = dob;
		this.owner_id = owner_id;
	}
}
