package com.app.pet;

import org.springframework.data.repository.PagingAndSortingRepository;


public interface PetRepository extends PagingAndSortingRepository<Pet, Long> {

}

