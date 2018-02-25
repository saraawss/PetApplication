package com.app.pet;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

	private final OwnerRepository ownerRepository;
	private final PetRepository petRepository;

	@Autowired
	public DatabaseLoader(OwnerRepository ownerRepository, PetRepository petRepository) {
		this.ownerRepository = ownerRepository;
		this.petRepository = petRepository;
	}

	@Override
	public void run(String... strings) throws Exception {

		this.ownerRepository.save(new Owner("Frodo", "Baggins", "Sydney"));
		this.ownerRepository.save(new Owner("Bilbo", "Baggins", "Melbourne"));
		this.ownerRepository.save(new Owner("Gandalf", "the Grey", "Perth"));
		this.ownerRepository.save(new Owner("Samwise", "Gamgee", "Sydney"));
		this.ownerRepository.save(new Owner("Meriadoc", "Brandybuck", "Perth"));
		this.ownerRepository.save(new Owner("Peregrin", "Took", "Melbourne"));
		
		this.petRepository.save(new Pet("Bagira", "2014-09-05", new Long(1)));
		this.petRepository.save(new Pet("Kitara", "2015-06-07", new Long(2)));
	}
}
