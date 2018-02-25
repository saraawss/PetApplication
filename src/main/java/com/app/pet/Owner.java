package com.app.pet;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Version;

import lombok.Data;

import com.fasterxml.jackson.annotation.JsonIgnore;


@Data
@Entity
public class Owner {

	private @Id @GeneratedValue Long id;
	private String firstName;
	private String lastName;
	private String city;

	private @Version @JsonIgnore Long version;

	private Owner() {}

	public Owner(String firstName, String lastName, String city) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.city = city;
	}
}
